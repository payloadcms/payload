import { describe, expect, it } from 'vitest'

import { transformTanStackRouter } from './transform-router.js'

function expectSuccessfulTransform(result: ReturnType<typeof transformTanStackRouter>) {
  expect(result.success).toBe(true)

  if (!result.success) {
    throw new Error(result.reason)
  }

  return result
}

function getRouterContent({
  imports = `import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'`,
  properties = `
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: { auth: undefined! },`,
}: {
  imports?: string
  properties?: string
} = {}) {
  return `${imports}

export function getRouter() {
  const router = createTanStackRouter({${properties}
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
`
}

describe('transformTanStackRouter', () => {
  it('should integrate Payload with an aliased official getRouter declaration', () => {
    const content = getRouterContent()

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(result.modified).toBe(true)
    expect(result.content).toContain(
      "import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start/shared'",
    )
    expect(result.content).toContain('const router = createTanStackRouter({')
    expect(result.content).toContain('parseSearch: payloadParseSearch')
    expect(result.content).toContain('stringifySearch: payloadStringifySearch')
    expect(result.content).toContain('routeTree')
    expect(result.content).toContain("defaultPreload: 'intent'")
    expect(result.content).toContain('scrollRestoration: true')
    expect(result.content).toContain('context: { auth: undefined! }')
    expect(result.content).toContain("declare module '@tanstack/react-router'")
    expect(result.content).toContain('router: ReturnType<typeof getRouter>')
  })

  it('should preserve router components and unrelated options', () => {
    const content = getRouterContent({
      properties: `
    routeTree,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: Pending,
    defaultPreload: 'viewport',
    trailingSlash: 'always',`,
    })

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(result.content).toContain('defaultNotFoundComponent: NotFound')
    expect(result.content).toContain('defaultPendingComponent: Pending')
    expect(result.content).toContain("defaultPreload: 'viewport'")
    expect(result.content).toContain("trailingSlash: 'always'")
  })

  it('should report an already transformed router as unmodified', () => {
    const firstResult = expectSuccessfulTransform(
      transformTanStackRouter({ content: getRouterContent() }),
    )
    const secondResult = expectSuccessfulTransform(
      transformTanStackRouter({ content: firstResult.content }),
    )

    expect(secondResult).toEqual({ content: firstResult.content, modified: false, success: true })
  })

  it('should not add value bindings to an unrelated type-only Payload import', () => {
    const content = getRouterContent({
      imports: `import type { SearchOptions } from '@payloadcms/tanstack-start/shared'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'`,
    })

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(result.content).toContain(
      "import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start/shared'",
    )
    expect(result.content).toContain(
      "import type { SearchOptions } from '@payloadcms/tanstack-start/shared'",
    )
  })

  it('should restore missing Payload imports for otherwise configured search options', () => {
    const content = getRouterContent({
      properties: `
    parseSearch: payloadParseSearch,
    routeTree,
    stringifySearch: payloadStringifySearch,`,
    })

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(result.modified).toBe(true)
    expect(result.content).toContain(
      "import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start/shared'",
    )
  })

  it.each(['parseSearch', 'stringifySearch'])(
    'should reject an existing non-Payload %s option',
    (name) => {
      const content = getRouterContent({
        properties: `
    routeTree,
    ${name}: customSearchSerializer,`,
      })

      const result = transformTanStackRouter({ content })

      expect(result).toEqual({
        reason: `The router already defines a non-Payload ${name} option.`,
        success: false,
      })
    },
  )

  it('should reject Payload-named search options imported from another module', () => {
    const content = getRouterContent({
      imports: `import { payloadParseSearch, payloadStringifySearch } from 'custom-search'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'`,
      properties: `
    routeTree,
    parseSearch: payloadParseSearch,
    stringifySearch: payloadStringifySearch,`,
    }).replaceAll('createTanStackRouter', 'createRouter')

    const result = transformTanStackRouter({ content })

    expect(result).toEqual({
      reason: 'Identifier "payloadParseSearch" is already bound incompatibly.',
      success: false,
    })
  })

  it.each([
    ['payloadParseSearch', `const payloadParseSearch = customSearchSerializer`],
    ['payloadStringifySearch', `function payloadStringifySearch() { return '' }`],
  ])('should reject an incompatible %s destination binding', (name, binding) => {
    const content = getRouterContent().replace(
      'export function getRouter()',
      `${binding}\n\nexport function getRouter()`,
    )

    const result = transformTanStackRouter({ content })

    expect(result).toEqual({
      reason: `Identifier "${name}" is already bound incompatibly.`,
      success: false,
    })
  })

  it('should reject object spreads that could override search serialization', () => {
    const content = getRouterContent({
      properties: `
    routeTree,
    ...routerOptions,`,
    })

    const result = transformTanStackRouter({ content })

    expect(result).toEqual({
      reason: 'Router object spreads cannot be transformed safely.',
      success: false,
    })
  })

  it('should reject multiple createRouter calls', () => {
    const content = `${getRouterContent()}

const otherRouter = createTanStackRouter({ routeTree })
`

    const result = transformTanStackRouter({ content })

    expect(result).toEqual({
      reason: 'Expected exactly one createRouter() call.',
      success: false,
    })
  })
})
