// cypress support file for tests placed in the root `e2e` folder
// add global commands or setup here if needed

// Suppress uncaught errors that we don't want to fail the test
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});