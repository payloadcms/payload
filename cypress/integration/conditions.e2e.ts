describe('Collections', () => {
  before(() => {
    cy.apiLogin();
  });

  beforeEach(() => {
    cy.visit('/admin/collections/conditions/create');
  });

  it('can see conditional fields', () => {
    cy.get('#simpleCondition')
      .should('not.exist');

    cy.get('#customComponent')
      .should('not.exist');

    cy.contains('Enable Test').click();

    cy.get('#simpleCondition')
      .should('be.visible');

    cy.get('#customComponent')
      .should('be.visible');
  });
});
