import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

import rule from './no-vitest-scoped-methods.js'

// Wire ESLint's RuleTester into Vitest so each case becomes a real test. These
// static hooks exist at runtime but are not declared in `@types/eslint`.
const ruleTesterHooks = RuleTester as unknown as {
  afterAll: typeof afterAll
  describe: typeof describe
  it: typeof it
  itOnly: typeof it.only
}
ruleTesterHooks.afterAll = afterAll
ruleTesterHooks.describe = describe
ruleTesterHooks.it = it
ruleTesterHooks.itOnly = it.only

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

ruleTester.run('no-vitest-scoped-methods', rule, {
  valid: [
    "describe('posts', () => {})",
    'beforeEach(() => {})',
    "test('creates a post', () => {})",
    "test.skip('creates a post', () => {})",
    "test.each([])('creates a post', () => {})",
    "test.runIf(true)('creates a post', () => {})",
    "test.options({ db: 'mongo' })('creates a post', () => {})",
    "playwrightTest.describe('posts', () => {})",
  ],
  invalid: [
    {
      code: "test.describe('posts', () => {})",
      errors: [
        { data: { method: 'describe', testIdentifier: 'test' }, messageId: 'useStandalone' },
      ],
    },
    {
      code: 'test.beforeEach(() => {})',
      errors: [
        { data: { method: 'beforeEach', testIdentifier: 'test' }, messageId: 'useStandalone' },
      ],
    },
    {
      code: 'it.afterAll(() => {})',
      errors: [{ data: { method: 'afterAll', testIdentifier: 'it' }, messageId: 'useStandalone' }],
    },
    {
      code: "test.suite({ config: './config.ts' })('posts', () => {})",
      errors: [{ data: { method: 'suite', testIdentifier: 'test' }, messageId: 'useStandalone' }],
    },
    {
      code: "test.describe.each([])('posts', () => {})",
      errors: [
        { data: { method: 'describe', testIdentifier: 'test' }, messageId: 'useStandalone' },
      ],
    },
    {
      code: "test.options({ db: 'mongo' }).describe('posts', () => {})",
      errors: [
        {
          data: { method: 'describe', testIdentifier: 'test' },
          messageId: 'useStandalone',
        },
      ],
    },
    {
      code: "test['beforeEach'](() => {})",
      errors: [
        { data: { method: 'beforeEach', testIdentifier: 'test' }, messageId: 'useStandalone' },
      ],
    },
  ],
})
