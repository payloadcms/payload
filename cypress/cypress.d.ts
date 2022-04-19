export { };

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      visitAdmin(): Chainable<any>
      /**
       * Login
       *
       * Creates user if not exists
       */
      login(): Chainable<any>
      apiLogin(): Chainable<any>
    }
  }
}
