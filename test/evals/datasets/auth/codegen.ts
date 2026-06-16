import type { CodegenEvalCase } from '../../types.js'

export const authCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    assertions: [
      { slug: 'customers', kind: 'collectionOption', path: 'auth.loginWithUsername', value: true },
    ],
    category: 'auth',
    expected:
      'auth.loginWithUsername on the customers collection set to an object with allowEmailLogin: true so both username and email are accepted at login',
    fixturePath: 'auth/codegen/login-with-username',
    input:
      'Enable login with username on the customers collection, allowing email as a fallback so users can log in with either their username or email address.',
  },
  {
    assertions: [
      { slug: 'users', kind: 'collectionOption', path: 'auth.tokenExpiration', value: 3600 },
    ],
    category: 'auth',
    expected:
      'auth.tokenExpiration on the users collection changed from 86400 to 3600 (seconds in one hour)',
    fixturePath: 'auth/codegen/token-expiration-1h',
    input:
      'Configure the JWT on the users collection to expire in 1 hour instead of the current 24-hour setting.',
  },
  {
    assertions: [
      { slug: 'services', kind: 'collectionExists' },
      { slug: 'services', kind: 'collectionOption', path: 'auth.useAPIKey', value: true },
      {
        slug: 'services',
        kind: 'collectionOption',
        path: 'auth.disableLocalStrategy',
        value: true,
      },
    ],
    category: 'auth',
    expected:
      'A new services collection with auth.useAPIKey: true and auth.disableLocalStrategy: true so only API key auth is allowed',
    fixturePath: 'auth/codegen/api-key-only-collection',
    input:
      'Add a services collection that can only be authenticated via API key — password login should not be possible.',
  },
  {
    assertions: [{ kind: 'configOption', path: 'csrf' }],
    category: 'auth',
    expected:
      'Root-level csrf array added (or appended to) in buildConfig with https://app.mysite.com included',
    fixturePath: 'auth/codegen/add-csrf-allowlist',
    input:
      'Add a CSRF allow-list to the config so that my frontend at https://app.mysite.com can send authenticated requests using the HTTP-only cookie.',
  },
  // docs-grounded: no test/ config sets auth.cookies.sameSite: 'None' + secure: true; pattern is documented at docs/authentication/cookies.mdx.
  {
    assertions: [
      { slug: 'users', kind: 'collectionOption', path: 'auth.cookies.sameSite', value: 'None' },
      { slug: 'users', kind: 'collectionOption', path: 'auth.cookies.secure', value: true },
    ],
    category: 'auth',
    expected:
      'auth.cookies.sameSite set to "None" and auth.cookies.secure set to true on the users collection to enable cross-domain cookie auth',
    fixturePath: 'auth/codegen/crossdomain-cookies',
    input:
      'Configure the users collection cookies so the auth cookie works across domains — the frontend is on a different domain than the API.',
  },
  {
    assertions: [{ slug: 'customers', kind: 'collectionOption', path: 'auth.verify', value: true }],
    category: 'auth',
    expected:
      'auth.verify set to true (or an object with verify options) on the customers collection',
    fixturePath: 'auth/codegen/enable-email-verification',
    input:
      'Enable email verification for the customers collection so users must verify their email before they can log in.',
  },
  {
    assertions: [
      { slug: 'users', field: 'roles', kind: 'fieldOption', option: 'saveToJWT', value: true },
    ],
    category: 'auth',
    expected:
      'saveToJWT: true added to the roles field on the users collection so it is encoded in the JWT',
    fixturePath: 'auth/codegen/save-roles-to-jwt',
    input:
      'Save the roles field to the JWT on the users collection so that access control functions can read roles from req.user without a database query.',
  },
  {
    assertions: [
      { slug: 'users', field: 'email', kind: 'fieldExists' },
      { slug: 'users', field: 'email', kind: 'fieldOption', option: 'access' },
    ],
    category: 'auth',
    expected:
      'An email field override added to the users collection fields array with an access.read function that restricts reading to admins',
    fixturePath: 'auth/codegen/override-email-field-access',
    input:
      'Override the email field on the users collection to add field-level access so that only admins can read it.',
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    assertions: [
      {
        slug: 'customers',
        kind: 'collectionOption',
        path: 'auth.loginWithUsername.allowEmailLogin',
        value: true,
      },
    ],
    category: 'auth',
    expected:
      'auth.loginWithUsername changed from true to { allowEmailLogin: true } (or { allowEmailLogin: true, requireUsername: false }) on the customers collection so both username and email are accepted at login',
    fixturePath: 'auth/codegen/fix-login-with-username',
    input:
      'This config uses loginWithUsername: true (shorthand) on the customers collection, but users can only log in with username — email fallback does not work. Fix it so users can log in with either username OR email.',
  },
]
