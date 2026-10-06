import * as tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

import rule from './no-ui-client-subpaths.js'

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

ruleTester.run('no-ui-client-subpaths', rule, {
  valid: [
    // The client barrel
    "import { Button } from '@payloadcms/ui'",
    // Server and shared subpaths
    "import { CollectionCards } from '@payloadcms/ui/rsc'",
    "import { getViewportContent } from '@payloadcms/ui/shared'",
    "import { getRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'",
    // A server exception inside a client wildcard (`./elements/*`)
    "import { DefaultNav } from '@payloadcms/ui/elements/Nav'",
    // Types don't load any code
    "import type { Props } from '@payloadcms/ui/elements/Button'",
    "import { type Props } from '@payloadcms/ui/elements/Button'",
    "export type { Props } from '@payloadcms/ui/elements/Button'",
    // Other packages
    "import { Link } from '@payloadcms/ui-extra/elements/Link'",
  ],
  invalid: [
    {
      code: "import { Button } from '@payloadcms/ui/elements/Button'",
      errors: [{ messageId: 'clientSubpath' }],
    },
    {
      code: "import { useRouteTransition } from '@payloadcms/ui/providers/RouteTransition'",
      errors: [{ messageId: 'clientSubpath' }],
    },
    {
      code: "import { RootProviders } from '@payloadcms/ui/layouts/RootProviders'",
      errors: [{ messageId: 'clientSubpath' }],
    },
    {
      code: "export { PlusIcon } from '@payloadcms/ui/icons/Plus'",
      errors: [{ messageId: 'clientSubpath' }],
    },
    {
      code: "const Banner = await import('@payloadcms/ui/elements/Banner')",
      errors: [{ messageId: 'clientSubpath' }],
    },
  ],
})
