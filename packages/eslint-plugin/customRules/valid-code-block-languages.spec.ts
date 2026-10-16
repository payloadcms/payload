import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

import mdxTextParser from './mdx-text-parser.js'
import rule from './valid-code-block-languages.js'

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
    parser: mdxTextParser,
  },
})

ruleTester.run('valid-code-block-languages', rule, {
  valid: [
    {
      code: ['```diff', '-const depth = 1', '+const depth = 2', '```'].join('\n'),
    },
    {
      code: ['```markdown', '# Heading', '```'].join('\n'),
    },
  ],
  invalid: [
    {
      code: ['```unsupported', 'example', '```'].join('\n'),
      errors: [{ messageId: 'unsupportedLanguage' }],
    },
  ],
})
