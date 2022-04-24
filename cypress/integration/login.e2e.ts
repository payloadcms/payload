/* eslint-disable jest/expect-expect */
import { adminURL } from './common/constants';
import { credentials } from './common/credentials';

const viewportSizes: Cypress.ViewportPreset[] = ['macbook-15', 'iphone-x', 'ipad-2'];

describe.skip('Payload Login', () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  after(() => {
    cy.apiLogin();
  });

  viewportSizes.forEach((viewportSize) => {
    describe(`Login (${viewportSize})`, () => {
      beforeEach(() => {
        cy.visit(adminURL);
      });

      it('success', () => {
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

      it('bad Password', () => {
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

      it('bad Password - Retry Success', () => {
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
