import credentials from './common/credentials';

const adminURL = 'http://localhost:3000/admin'
const viewportSizes: Cypress.ViewportPreset[] = ['macbook-15', 'iphone-x', 'ipad-2'];

describe('Payload Login', () => {

  before('first login', () => {
    cy.visit(adminURL)

    cy.get('#email').type(credentials.email);
    cy.get('#password').type(credentials.password);
    cy.get('#confirm-password').type(credentials.password);

    cy.get('.rs__indicators').first()
      .click();
    cy.get('.rs__menu').first().contains('admin')
      .click();

    cy.get('form')
      .contains('form', 'Create')
      .should('be.visible')
      .submit();

    cy.get('.template-default')
      .should('be.visible');

    cy.visit(`${adminURL}/logout`);
    cy.get('.logout__wrap')
      .contains('You have been logged out successfully.')
      .should('be.visible')
  })

  viewportSizes.forEach((viewportSize) => {

    describe(`Login (${viewportSize})`, () => {

      beforeEach(() => {
        cy.visit(adminURL);
      })

      it('Success', () => {
        cy.viewport(viewportSize);

        cy.get('#email').type(credentials.email);
        cy.get('#password').type(credentials.password);
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();
        cy.get('.template-default')
          .find('h3.dashboard__label')
          .should('have.length', 2); // TODO: Should assert label content
        cy.url().should('eq', adminURL);
      });

      it('Bad Password', () => {
        cy.viewport(viewportSize);

        cy.visit(adminURL);
        cy.get('#email').type(credentials.email);
        cy.get('#password').type('badpassword');
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();

        cy.get('.Toastify')
          .contains('The email or password provided is incorrect.')
          .should('be.visible');
      });

      it('Bad Password - Retry Success', () => {
        cy.viewport(viewportSize);

        cy.visit(adminURL);
        cy.get('#email').type(credentials.email);
        cy.get('#password').type('badpassword');
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();

        cy.get('.Toastify')
          .contains('The email or password provided is incorrect.')
          .should('be.visible');

        // Dismiss notification
        cy.wait(500);
        cy.get('.Toastify__toast-body').click();
        cy.wait(200);
        cy.get('.Toastify__toast-body').should('not.be.visible');
        cy.url().should('eq', `${adminURL}/login`);

        cy.get('#password').clear().type(credentials.password);
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();

        cy.get('.template-default')
          .find('h3.dashboard__label')
          .should('have.length', 2); // TODO: Should assert label content

        cy.url().should('eq', adminURL);
      });
    });
  });

});
