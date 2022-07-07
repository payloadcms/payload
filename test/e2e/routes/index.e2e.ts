import cy from 'cypress';
import { initPayloadTest } from '../../helpers/configHelpers';
// import { credentials } from './common/credentials';

let serverURL: string;

describe('Collections', () => {
  before(async () => {
    ({ serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    }));
  });

  it('can view collection', () => {
    cy.visit(`${serverURL}/admin`);

    // cy.get('.collection-list__wrap')
    //   .should('be.visible');
    // cy.get('.collection-list__header')
    //   .contains(collectionName)
    //   .should('be.visible');

    // cy.get('.table')
    //   .contains(credentials.email)
    //   .should('be.visible');
  });
});
