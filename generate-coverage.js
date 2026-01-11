const fs = require('fs').promises;
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const reports = require('istanbul-reports');
const { createContext } = require('istanbul-lib-report');
const { createCoverageMap } = require('istanbul-lib-coverage');

const coverageDir = path.join(process.cwd(), 'coverage/temp'); // Playwright v8 coverage
const istanbulCoverageDir = path.join(process.cwd(), 'coverage/frontend'); // Final report output

async function convertCoverage() {
  // Exit if no coverage data exists
  try {
    await fs.access(coverageDir);
  } catch {
    console.log('No coverage data found.');
    return;
  }

  const coverageMap = createCoverageMap();
  const files = await fs.readdir(coverageDir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const v8Coverage = JSON.parse(await fs.readFile(path.join(coverageDir, file), 'utf-8'));

    for (const entry of v8Coverage) {
      if (!entry.url || !entry.source) continue;

      // Skip non-JS files, node_modules, or external URLs (except localhost)
      let pathname;
      try {
        pathname = entry.url.startsWith('http') || entry.url.startsWith('file://')
          ? new URL(entry.url).pathname
          : entry.url;
      } catch {
        pathname = entry.url;
      }

      if (!pathname.endsWith('.js') ||
          (entry.url.startsWith('http') && !entry.url.includes('localhost')) ||
          entry.url.includes('node_modules') ||
          pathname.includes('kleaven.js') ||
          entry.url.includes('kleaven.js')) {
        console.warn(`Skipping file: ${entry.url}`);
        continue;
      }

      // Handle Windows file paths
      const filePath = entry.url.startsWith('file://')
        ? pathname.replace(/^\/([a-zA-Z]:)/, '$1') // /C:/path -> C:/path
        : pathname;

      try {
        const converter = v8toIstanbul("public/" + filePath, 0, { source: entry.source });
        await converter.load();
        converter.applyCoverage(entry.functions);
        coverageMap.merge(converter.toIstanbul());
      } catch (err) {
        console.warn(`Skipping coverage for ${entry.url}: ${err.message}`);
      }
    }
  }

  if (!Object.keys(coverageMap.data).length) {
    console.log('No coverage data was converted.');
    return;
  }

  // Ensure output directory exists
  try {
    await fs.access(istanbulCoverageDir);
  } catch {
    await fs.mkdir(istanbulCoverageDir, { recursive: true });
  }

  // Generate HTML and lcov reports
  const context = createContext({ dir: istanbulCoverageDir, coverageMap }); // create istanbul report context for html/lcov generation
  ['html', 'lcovonly'].forEach(type => reports.create(type).execute(context));



  // enforce coverage thresholds for the frontend POST feature in `matin.js`. find entry that endwith `matin.js` and compute a per-file summary for threshold checking.
  const allFiles = Object.keys(coverageMap.data); // list all converted coverage entries
  const matinKey = allFiles.find(k => k.replace(/\\/g, '/').endsWith('/matin.js') || k.endsWith('matin.js')); // try to find the matin.js entry

  if (!matinKey) {
    console.warn('matin.js not found in converted coverage; skipping per-file threshold check.'); // matin not present, nothing to gate :/
    console.log(`Coverage report generated in ${istanbulCoverageDir}`); // still spit out report
    return; // stop here so we don't crash
  }

  // Create a coverage map containing only matin.js and compute its summary
  const matinMap = createCoverageMap({ [matinKey]: coverageMap.data[matinKey] }); // isolate matin.js coverage only
  const summary = matinMap.getCoverageSummary().data; // get lines/statements/functions/branches % for matin.js

  // Define minimum acceptable coverage thresholds for each metric (in percentage)
  const thresholds = { // threshold values (percent) applied only to matin.js
    lines: 90, // min % of lines covered
    statements: 90, // min % of statements covered
    functions: 90, // min % of functions invoked
    branches: 90 // min % of branches covered
  };
  

  let belowThreshold = []; // collect metrics that fail the gate
  for (const [metric, threshold] of Object.entries(thresholds)) { // check each metric
    const covered = summary[metric].pct; // actual percent for this metric
    if (covered < threshold) {
      belowThreshold.push(`${metric}: ${covered}% (below ${threshold}%)`); // record failure
    }
  }

  if (belowThreshold.length > 0) {
    console.error(`\nX Coverage threshold NOT met for matin.js (${matinKey}):`); // show header for failing gate
    belowThreshold.forEach(msg => console.error(` - ${msg}`)); // print each failing metric
    process.exitCode = 1; // fail the process so CI fails :/
  } else {
    console.log('\n✓ All coverage thresholds met for matin.js.'); // success message :)
  }

  console.log(`Coverage report generated in ${istanbulCoverageDir}`);
}

convertCoverage();