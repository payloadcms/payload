import { adminURL } from '../integration/common/constants';
import { credentials } from '../integration/common/credentials';

Cypress.Commands.add('visitAdmin', () => {
  cy.visit(adminURL);
});

Cypress.Commands.add('login', () => {
  cy.clearCookies();
  cy.visit(adminURL);
  cy.get('#email').type(credentials.email);
  cy.get('#password').type(credentials.password);

  cy.get('body')
    .then((body) => {
      if (body.find('.dashboard__card-list').length) {
        cy.get('.dashboard__card-list')
          .should('be.visible');
      }

      if (body.find('#confirm-password').length) {
        cy.get('#confirm-password').type(credentials.password);
        cy.get('.rs__indicators').first()
          .click();
        cy.get('.rs__menu').first().contains('admin')
          .click();

        cy.get('form')
          .contains('form', 'Create')
          .should('be.visible')
          .submit();
      }

      if (body.find('form').length) {
        cy.get('form')
          .contains('form', 'Login')
          .should('be.visible')
          .submit();
      }
      cy.get('.dashboard__card-list')
        .should('be.visible');
    });
});

Cypress.Commands.add('apiLogin', () => {
  cy.api({
    url: '/api/admins/login',
    method: 'POST',
    body: credentials,
    failOnStatusCode: true,
  }).should(({ status }) => {
    cy.wrap(status).should('equal', 200);
  });
});
