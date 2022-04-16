const adminURL = 'http://localhost:3000/admin';

describe('Login', () => {
  it('success', () => {
    cy.login();
  })
});
