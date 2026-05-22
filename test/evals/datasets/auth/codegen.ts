import type { CodegenEvalCase } from '../../types.js'

/**
 * Authentication eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * The assertion catalog covers collections, fields, hooks, and access — not
 * collection-level config properties like `auth.tokenExpiration`. Cases
 * involving only auth config options rely on the OpenAI scorer rather than
 * AST checks.
 */
export const authCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Enable login with username on the customers collection, allowing email as a fallback so users can log in with either their username or email address.',
    expected:
      'auth.loginWithUsername on the customers collection set to an object with allowEmailLogin: true so both username and email are accepted at login',
    category: 'auth',
    fixturePath: 'auth/codegen/login-with-username',
    // No AST assertion kind covers collection-level auth config properties — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Configure the JWT on the users collection to expire in 1 hour instead of the current 24-hour setting.',
    expected:
      'auth.tokenExpiration on the users collection changed from 86400 to 3600 (seconds in one hour)',
    category: 'auth',
    fixturePath: 'auth/codegen/token-expiration-1h',
    // No AST assertion kind covers collection-level auth config properties — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a services collection that can only be authenticated via API key — password login should not be possible.',
    expected:
      'A new services collection with auth.useAPIKey: true and auth.disableLocalStrategy: true so only API key auth is allowed',
    category: 'auth',
    fixturePath: 'auth/codegen/api-key-only-collection',
    assertions: [{ kind: 'collectionExists', slug: 'services' }],
  },
  {
    input:
      'Add a CSRF allow-list to the config so that my frontend at https://app.mysite.com can send authenticated requests using the HTTP-only cookie.',
    expected:
      'Root-level csrf array added (or appended to) in buildConfig with https://app.mysite.com included',
    category: 'auth',
    fixturePath: 'auth/codegen/add-csrf-allowlist',
    // No AST assertion kind covers root-level buildConfig options like csrf[] — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Configure the users collection cookies so the auth cookie works across domains — the frontend is on a different domain than the API.',
    expected:
      'auth.cookies.sameSite set to "None" and auth.cookies.secure set to true on the users collection to enable cross-domain cookie auth',
    category: 'auth',
    fixturePath: 'auth/codegen/crossdomain-cookies',
    // No AST assertion kind covers collection-level auth.cookies properties — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Enable email verification for the customers collection so users must verify their email before they can log in.',
    expected:
      'auth.verify set to true (or an object with verify options) on the customers collection',
    category: 'auth',
    fixturePath: 'auth/codegen/enable-email-verification',
    // No AST assertion kind covers collection-level auth config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Save the roles field to the JWT on the users collection so that access control functions can read roles from req.user without a database query.',
    expected:
      'saveToJWT: true added to the roles field on the users collection so it is encoded in the JWT',
    category: 'auth',
    fixturePath: 'auth/codegen/save-roles-to-jwt',
    assertions: [
      { kind: 'fieldExists', slug: 'users', field: 'roles' },
      { kind: 'fieldOption', slug: 'users', field: 'roles', option: 'saveToJWT', value: true },
    ],
  },
  {
    input:
      'Override the email field on the users collection to add field-level access so that only admins can read it.',
    expected:
      'An email field override added to the users collection fields array with an access.read function that restricts reading to admins',
    category: 'auth',
    fixturePath: 'auth/codegen/override-email-field-access',
    assertions: [
      { kind: 'fieldExists', slug: 'users', field: 'email' },
      { kind: 'fieldOption', slug: 'users', field: 'email', option: 'access' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config uses loginWithUsername: true (shorthand) on the customers collection, but users can only log in with username — email fallback does not work. Fix it so users can log in with either username OR email.',
    expected:
      'auth.loginWithUsername changed from true to { allowEmailLogin: true } (or { allowEmailLogin: true, requireUsername: false }) on the customers collection so both username and email are accepted at login',
    category: 'auth',
    fixturePath: 'auth/codegen/fix-login-with-username',
    // No AST assertion kind covers collection-level auth config — scorer carries the load.
    assertions: [],
  },
]
