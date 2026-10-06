import * as tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

import rule from './ui-folder-boundaries.js'

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
    parser: tsParser,
    sourceType: 'module',
  },
})

const ui = '/repo/packages/ui/src'

ruleTester.run('ui-folder-boundaries', rule, {
  valid: [
    // Server code reaches client components through the client barrel
    {
      code: "import { Button } from '../../../exports/client/index.js'",
      filename: `${ui}/server/views/Login/index.tsx`,
    },
    // Every folder may use shared code and neutral files (global css, assets)
    {
      code: "import { formatDocTitle } from '../../../shared/utilities/formatDocTitle/index.js'",
      filename: `${ui}/server/views/Document/index.tsx`,
    },
    {
      code: "import { formatDocTitle } from '../../../shared/utilities/formatDocTitle/index.js'",
      filename: `${ui}/client/elements/DocumentTitle/index.tsx`,
    },
    {
      code: "import { payloadFaviconDark } from '../../../assets/index.js'",
      filename: `${ui}/shared/graphics/Logo/index.tsx`,
    },
    // Type-only imports never run, so they may cross any boundary
    {
      code: "import type { ButtonProps } from '../../../client/elements/Button/types.js'",
      filename: `${ui}/server/views/Login/index.tsx`,
    },
    {
      code: "import { type ButtonProps } from '../../../client/elements/Button/types.js'",
      filename: `${ui}/shared/elements/FormHeader/index.tsx`,
    },
    {
      code: "export type { NavProps } from '../../../server/elements/Nav/index.js'",
      filename: `${ui}/client/elements/Nav/index.client.tsx`,
    },
    // The client barrel re-exports client and shared code
    {
      code: "export { Button } from '../../client/elements/Button/index.js'",
      filename: `${ui}/exports/client/index.ts`,
    },
    // Package imports and files outside packages/ui/src are not checked
    {
      code: "import { Button } from '@payloadcms/ui'",
      filename: `${ui}/server/views/Login/index.tsx`,
    },
    {
      code: "import { x } from '../../../ui/src/client/elements/Button/index.js'",
      filename: '/repo/packages/next/src/views/index.tsx',
    },
  ],
  invalid: [
    {
      code: "import { Button } from '../../../client/elements/Button/index.js'",
      errors: [{ messageId: 'serverImportsClient' }],
      filename: `${ui}/server/views/Login/index.tsx`,
    },
    {
      code: "import '../../../client/views/List/index.css'",
      errors: [{ messageId: 'serverImportsClient' }],
      filename: `${ui}/server/views/List/index.tsx`,
    },
    {
      code: "const mod = import('../../../client/elements/CodeEditor/index.js')",
      errors: [{ messageId: 'serverImportsClient' }],
      filename: `${ui}/server/views/API/index.tsx`,
    },
    {
      code: "import { getNavPrefs } from '../../../server/elements/Nav/getNavPrefs.js'",
      errors: [{ messageId: 'clientImportsServer' }],
      filename: `${ui}/client/elements/Nav/index.client.tsx`,
    },
    {
      code: "export { RenderServerComponent } from '../../server/elements/RenderServerComponent/index.js'",
      errors: [{ messageId: 'clientImportsServer' }],
      filename: `${ui}/exports/client/index.ts`,
    },
    {
      code: "import { useConfig } from '../../../client/providers/Config/index.js'",
      errors: [{ messageId: 'sharedImportsOther' }],
      filename: `${ui}/shared/elements/FormHeader/index.tsx`,
    },
    {
      code: "import { Button } from '../../../exports/client/index.js'",
      errors: [{ messageId: 'sharedImportsOther' }],
      filename: `${ui}/shared/elements/FormHeader/index.tsx`,
    },
    {
      code: "export * from '../../server/utilities/getClientConfig.js'",
      errors: [{ messageId: 'sharedImportsOther' }],
      filename: `${ui}/exports/shared/index.ts`,
    },
  ],
})
