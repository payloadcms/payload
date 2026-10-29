// Pino ships types for its Node entry point only; its browser logger has the same public API.
declare module 'pino/browser.js' {
  import type pino from 'pino'

  const browserPino: typeof pino
  export = browserPino
}
