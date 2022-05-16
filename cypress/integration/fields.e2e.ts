describe('Fields', () => {
  before(() => {
    cy.apiLogin();
  });

  describe('Array', () => {
    beforeEach(() => {
      cy.visit('/admin/collections/all-fields/create');
    });

    it('can add and remove rows', () => {
      cy.contains('Add Array').click();

      cy.contains('Array Text 1')
        .should('be.visible');

      cy.get('.action-panel__add-row').first().click();

      cy.get('.field-type.array')
        .filter(':contains("Editable Array")')
        .should('contain', '02');

      cy.get('.action-panel__remove-row').first().click();

      cy.get('.field-type.array')
        .filter(':contains("Editable Array")')
        .should('not.contain', '02')
        .should('contain', '01');
    });

    it('can be readOnly', () => {
      cy.get('.field-type.array')
        .filter(':contains("readOnly Array")')
        .should('not.contain', 'Add Row');

      cy.get('.field-type.array')
        .filter(':contains("readOnly Array")')
        .children('.action-panel__add-row')
        .should('not.exist');

      cy.get('.field-type.array')
        .filter(':contains("readOnly Array")')
        .children('.position-panel__move-backward')
        .should('not.exist');

      cy.get('.field-type.array')
        .filter(':contains("readOnly Array")')
        .children('.position-panel__move-forward')
        .should('not.exist');
    });
  });

  describe('Admin', () => {
    describe('Conditions', () => {
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
  });
});
