import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'test/**/*e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    supportFile: false,
  },
});

// {
//   "$schema": "https://on.cypress.io/cypress.schema.json",
//   "testFiles": "**/*e2e.ts",
//   "ignoreTestFiles": "**/examples/*spec.js",
//   "viewportWidth": 1440,
//   "viewportHeight": 900,
//   "baseUrl": "http://localhost:3000"
// }
