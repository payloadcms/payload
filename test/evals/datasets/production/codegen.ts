import type { CodegenEvalCase } from '../../types.js'

/**
 * Production eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 */
export const productionCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Restrict CORS to my production domains — https://app.myapp.com and https://staging.myapp.com — so that only those origins can access the API.',
    expected:
      'Root-level cors array added to buildConfig containing https://app.myapp.com and https://staging.myapp.com so that only those origins are permitted',
    category: 'production',
    fixturePath: 'production/codegen/add-cors-allowlist',
    assertions: [{ kind: 'configOption', path: 'cors' }],
  },
  {
    input:
      'Limit GraphQL query complexity to 1000 to prevent abusive queries from bogging down the server.',
    expected:
      'graphQL.maxComplexity set to 1000 in the root buildConfig so that GraphQL requests exceeding that complexity score are rejected',
    category: 'production',
    fixturePath: 'production/codegen/set-graphql-max-complexity',
    assertions: [{ kind: 'configOption', path: 'graphQL.maxComplexity', value: 1000 }],
  },
  {
    input:
      'Restrict the media collection uploads to images only — no videos, PDFs, or other file types should be accepted.',
    expected:
      'upload.mimeTypes set to an array containing "image/*" (or specific image mime types) on the media collection so that only image files are accepted',
    category: 'production',
    fixturePath: 'production/codegen/restrict-upload-mime-types',
    assertions: [{ kind: 'collectionOption', slug: 'media', path: 'upload.mimeTypes' }],
  },
  {
    input:
      'Disable local storage for the media collection so that uploaded files are not stored on the server filesystem.',
    expected:
      'upload.disableLocalStorage set to true on the media collection so that Payload does not write uploaded files to the local filesystem',
    category: 'production',
    fixturePath: 'production/codegen/disable-local-upload-storage',
    assertions: [
      {
        kind: 'collectionOption',
        slug: 'media',
        path: 'upload.disableLocalStorage',
        value: true,
      },
    ],
  },
  {
    input:
      'Lock the users collection after 5 failed login attempts and require them to wait 10 minutes before trying again.',
    expected:
      'auth.maxLoginAttempts set to 5 and auth.lockTime set to 600000 (10 minutes in milliseconds) on the users collection',
    category: 'production',
    fixturePath: 'production/codegen/set-max-login-attempts',
    assertions: [
      { kind: 'collectionOption', slug: 'users', path: 'auth.maxLoginAttempts', value: 5 },
      { kind: 'collectionOption', slug: 'users', path: 'auth.lockTime', value: 600000 },
    ],
  },
  {
    input:
      'Configure the Postgres adapter to run pending migrations automatically on server startup so I do not have to run them manually before each deployment.',
    expected:
      'prodMigrations added to the postgresAdapter config, importing migrations from the generated migrations index file so that pending migrations run at process initialization',
    category: 'production',
    fixturePath: 'production/codegen/postgres-prodmigrations',
    assertions: [{ kind: 'dbAdapterOption', adapter: 'postgres', path: 'prodMigrations' }],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      "This config uses csrf: ['*'] which allows any origin to send cookie-authenticated requests — this defeats CSRF protection. Fix it so only the specific production frontend at https://app.myapp.com is trusted.",
    expected:
      "csrf changed from ['*'] to an array containing only https://app.myapp.com (and optionally https://staging.myapp.com or similar specific origins) so that the wildcard is removed and only known frontends are trusted",
    category: 'production',
    fixturePath: 'production/codegen/fix-wildcard-csrf',
    // csrf key already exists in the fixture (that's the bug) — existence assertion
    // would be trivially satisfied. Rely on the scorer to verify the wildcard is removed.
    assertions: [],
  },
]
