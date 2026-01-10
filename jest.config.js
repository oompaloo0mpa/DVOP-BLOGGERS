module.exports = {
    // Specify the environment in which tests will run
    testEnvironment: 'node',
    // Define the pattern for test files
    // Jest will look for files ending with .test.js inside any 'tests' folder
    testMatch: ['**/tests/**/*.test.js'],
    // Enable code coverage collection
    collectCoverage: true,
    // Specify which files to include in the coverage report
    // Here, all JS files in 'utils' folder and 'index.js' are included
    collectCoverageFrom: [
        'utils/**/*.js',
        'index.js'
    ],
    // Directory where coverage reports will be saved
    coverageDirectory: 'coverage/backend',
    // Define the format(s) for coverage reports
    // 'text' outputs to console, 'html' creates a browsable HTML report
    coverageReporters: ['text', 'html'],
    // Set minimum coverage thresholds to enforce test quality
    // Tests will fail if coverage falls below these percentages
    coverageThreshold: {
        global: {
            branches: 20, // minimum 20% of conditional branches covered
            functions: 8, // minimum 8% of functions covered
            lines: 40, // minimum 40% of lines covered
            statements: 40, // minimum 40% of statements covered
        },
    },
}