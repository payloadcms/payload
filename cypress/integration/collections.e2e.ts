import { adminURL } from './common/constants';
import { credentials } from './common/credentials';

describe('Collections', () => {
  const collectionName = 'Admins';

  before(() => {
    cy.apiLogin();
  });

  beforeEach(() => {
    cy.visitAdmin();
  });

  it('can view collection', () => {
    cy.contains(collectionName).click();

    cy.get('.collection-list__wrap')
      .should('be.visible');
    cy.get('.collection-list__header')
      .contains(collectionName)
      .should('be.visible');

    cy.get('.table')
      .contains(credentials.email)
      .should('be.visible');
  });

  it('can create new', () => {
    cy.contains(collectionName).click();

    cy.contains('Create New').click();
    cy.url().should('contain', `${adminURL}/collections/${collectionName.toLowerCase()}/create`);
  });
  it('can create new - plus button', () => {
    cy.contains(collectionName)
      .get('.card__actions')
      .first()
      .click();

    cy.url().should('contain', `${adminURL}/collections/${collectionName.toLowerCase()}/create`);
  });
});
