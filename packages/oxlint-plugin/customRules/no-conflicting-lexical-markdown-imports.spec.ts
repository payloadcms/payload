import { RuleTester } from 'eslint'
import * as tsParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'

import rule from './no-conflicting-lexical-markdown-imports.js'

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

// Use the TypeScript parser so `import type { ... }` and inline `type` specifiers
// (which carry the `importKind` the rule inspects) parse correctly.
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parser: tsParser,
    sourceType: 'module',
  },
})

ruleTester.run('no-conflicting-lexical-markdown-imports', rule, {
  valid: [
    // Type-only imports never reach the editor at runtime.
    { code: "import type { CODE, TRANSFORMERS } from '@lexical/markdown'" },
    { code: "import { type CODE, type LINK } from '@lexical/markdown'" },
    // Importing the conversion functions is fine; only calling them without
    // a transformer list is a problem.
    { code: "import { $convertToMarkdownString } from '@lexical/markdown'" },
    // Calling with an explicit transformer list opts out of the mismatching default.
    {
      code: "import { $convertToMarkdownString } from '@lexical/markdown'\n$convertToMarkdownString(transformers)",
    },
    {
      code: "import { $convertFromMarkdownString } from '@lexical/markdown'\n$convertFromMarkdownString(md, transformers)",
    },
    {
      code: "import { registerMarkdownShortcuts } from '@lexical/markdown'\nregisterMarkdownShortcuts(editor, transformers)",
    },
    // A like-named call from an unrelated import must not be flagged.
    {
      code: "import { $convertToMarkdownString } from './local-helper.js'\n$convertToMarkdownString()",
    },
    // Unrelated named imports from the markdown package are allowed.
    { code: "import { $createCodeNode } from '@lexical/markdown'" },
    // Text format transformers do not conflict with Payload-specific markdown nodes.
    { code: "import { TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown'" },
    // Type-only HEADING import is fine (PAYLOAD_HEADING references its type).
    { code: "import { type HEADING } from '@lexical/markdown'" },
  ],
  invalid: [
    {
      code: "import { CODE } from '@lexical/markdown'",
      errors: [{ messageId: 'replacedTransformer' }],
    },
    {
      code: "import { LINK } from '@payloadcms/richtext-lexical/lexical/markdown'",
      errors: [{ messageId: 'replacedTransformer' }],
    },
    {
      code: "import { HEADING } from '@lexical/markdown'",
      errors: [{ messageId: 'headingTransformer' }],
    },
    {
      code: "import { TRANSFORMERS } from '@lexical/markdown'",
      errors: [{ messageId: 'transformerGroup' }],
    },
    {
      code: "import { ELEMENT_TRANSFORMERS } from '@lexical/markdown'",
      errors: [{ messageId: 'transformerGroup' }],
    },
    // Calling a default-transformer function without the transformers argument.
    {
      code: "import { $convertToMarkdownString } from '@lexical/markdown'\n$convertToMarkdownString()",
      errors: [{ messageId: 'defaultTransformerCall' }],
    },
    {
      code: "import { $convertFromMarkdownString } from '@lexical/markdown'\n$convertFromMarkdownString(md)",
      errors: [{ messageId: 'defaultTransformerCall' }],
    },
    {
      code: "import { registerMarkdownShortcuts } from '@lexical/markdown'\nregisterMarkdownShortcuts(editor)",
      errors: [{ messageId: 'defaultTransformerCall' }],
    },
    // Passing `undefined` explicitly still falls back to the default transformers.
    {
      code: "import { $convertToMarkdownString } from '@lexical/markdown'\n$convertToMarkdownString(undefined)",
      errors: [{ messageId: 'defaultTransformerCall' }],
    },
    // Renamed import is still tracked by its original (imported) name.
    {
      code: "import { $convertToMarkdownString as toMd } from '@lexical/markdown'\ntoMd()",
      errors: [{ messageId: 'defaultTransformerCall' }],
    },
  ],
})
