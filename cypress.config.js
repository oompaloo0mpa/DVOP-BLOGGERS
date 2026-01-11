const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5050',
    // Only pick up Cypress specs explicitly named with `.cypress.` to avoid
    // bundling non-Cypress tests (e.g. Playwright) placed in the same folder.
    specPattern: 'e2e/**/*.cypress.*',
    supportFile: 'e2e/cypress.support.js', // place support file inside existing e2e
    setupNodeEvents(on, config) {
      // add plugins here if needed
    }
  }
});
