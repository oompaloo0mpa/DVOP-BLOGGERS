/// <reference types="cypress" />

describe('Post Feature (matin.js / MatinUtil.js)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should open the Add Post modal when clicking the Add Post button', () => {
    cy.get('#openAddBtn').should('be.visible').click();
    cy.get('#modalBackdrop').should('be.visible');
    cy.get('#title').should('be.visible');
    cy.get('#content').should('be.visible');
  });

  it('should create a new post and show success notification', () => {
    const postTitle = 'Cypress Test Post ' + Date.now();

    cy.get('#openAddBtn').click();
    cy.get('#title').clear().type(postTitle);
    cy.get('#content').clear().type('This is test content from Cypress');
    cy.get('#owner').clear().type('test@example.com');
    cy.get('#modalAdd').click();

    // Verify success notification appears
    cy.get('#notif').should('be.visible').and('contain.text', 'Post added');

    // Verify the new post appears in the posts list
    cy.contains(postTitle).should('exist');
  });

  it('should show validation alert when title is missing', () => {
    cy.get('#openAddBtn').click();
    cy.get('#title').clear();
    cy.get('#content').clear().type('Content without title');

    // Stub the alert to capture it
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    cy.get('#modalAdd').click();
    cy.get('@alertStub').should('have.been.calledWith', 'Title and content are required!');
  });

  it('should show validation alert when content is missing', () => {
    cy.get('#openAddBtn').click();
    cy.get('#title').clear().type('Title without content');
    cy.get('#content').clear();

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    cy.get('#modalAdd').click();
    cy.get('@alertStub').should('have.been.calledWith', 'Title and content are required!');
  });

  it('should show validation alert for invalid email', () => {
    cy.get('#openAddBtn').click();
    cy.get('#title').clear().type('Test Title');
    cy.get('#content').clear().type('Test Content');
    cy.get('#owner').clear().type('invalid-email');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    cy.get('#modalAdd').click();
    cy.get('@alertStub').should('have.been.calledWith', 'Please enter a valid email for owner!');
  });

  it('should close modal when clicking Close button', () => {
    cy.get('#openAddBtn').click();
    cy.get('#modalBackdrop').should('be.visible');
    cy.get('#modalClose').click();
    cy.get('#modalBackdrop').should('not.be.visible');
  });

  it('should close modal when clicking X button', () => {
    cy.get('#openAddBtn').click();
    cy.get('#modalBackdrop').should('be.visible');
    cy.get('#modalCloseX').click();
    cy.get('#modalBackdrop').should('not.be.visible');
  });

  it('should clear form fields after successful post submission', () => {
    cy.get('#openAddBtn').click();
    cy.get('#title').clear().type('Clear Test Post');
    cy.get('#content').clear().type('Clear test content');
    cy.get('#modalAdd').click();

    // Wait for success notification
    cy.get('#notif').should('be.visible');

    // Open modal again and verify fields are cleared
    cy.get('#openAddBtn').click();
    cy.get('#title').should('have.value', '');
    cy.get('#content').should('have.value', '');
    cy.get('#owner').should('have.value', '');
  });
});




