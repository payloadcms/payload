import { adminURL } from '../integration/common/constants';
import { credentials } from '../integration/common/credentials';

Cypress.Cookies.preserveOnce('payload-token');

// Cypress.Cookies.defaults({
//   preserve: 'payload-token',
// })

Cypress.Commands.add('login', () => {
  cy.visit(adminURL);
  cy.get('#email').type(credentials.email);
  cy.get('#password').type(credentials.password);

  cy.get('body')
    .then((body) => {
      if (body.find('#confirm-password').length) {
        cy.get('#confirm-password').type(credentials.password)
        cy.get('.rs__indicators').first()
          .click();
        cy.get('.rs__menu').first().contains('admin')
          .click();

        cy.get('form')
          .contains('form', 'Create')
          .should('be.visible')
          .submit();
      } else {
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();
      }
    });
});
