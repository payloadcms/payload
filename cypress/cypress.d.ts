export { };

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /**
       * Login
       *
       * Creates user if not exists
       */
      login(): Chainable<any>
    }
  }
}
