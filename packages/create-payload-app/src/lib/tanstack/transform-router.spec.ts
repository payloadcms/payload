import { Project } from 'ts-morph'
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

function getPayloadSearchImports(content: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('router.tsx', content)

  return sourceFile
    .getImportDeclarations()
    .filter(
      (declaration) =>
        declaration.getModuleSpecifierValue() === '@payloadcms/tanstack-start/shared',
    )
    .flatMap((declaration) =>
      declaration.getNamedImports().map((namedImport) => ({
        importedName: namedImport.getName(),
        localName: namedImport.getAliasNode()?.getText() ?? namedImport.getName(),
      })),
    )
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

  it('should reuse aliased Payload search imports as the configured identifiers', () => {
    const content = getRouterContent({
      imports: `import { payloadParseSearch as parseWithPayload } from '@payloadcms/tanstack-start/shared'
import { payloadStringifySearch as stringifyWithPayload } from '@payloadcms/tanstack-start/shared'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'`,
    })

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(result.content).toContain('parseSearch: parseWithPayload')
    expect(result.content).toContain('stringifySearch: stringifyWithPayload')
    expect(getPayloadSearchImports(result.content)).toEqual([
      { importedName: 'payloadParseSearch', localName: 'parseWithPayload' },
      { importedName: 'payloadStringifySearch', localName: 'stringifyWithPayload' },
    ])
  })

  it('should preserve split Payload search imports without duplicating bindings', () => {
    const content = getRouterContent({
      imports: `import { payloadParseSearch } from '@payloadcms/tanstack-start/shared'
import { payloadStringifySearch } from '@payloadcms/tanstack-start/shared'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'`,
    })

    const result = expectSuccessfulTransform(transformTanStackRouter({ content }))

    expect(getPayloadSearchImports(result.content)).toEqual([
      { importedName: 'payloadParseSearch', localName: 'payloadParseSearch' },
      { importedName: 'payloadStringifySearch', localName: 'payloadStringifySearch' },
    ])
    expect(result.content).toContain('parseSearch: payloadParseSearch')
    expect(result.content).toContain('stringifySearch: payloadStringifySearch')
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

  it('should reject a locally constructed route tree', () => {
    const content = getRouterContent({
      imports: `import { createRouter as createTanStackRouter } from '@tanstack/react-router'

const routeTree = createRouteTree()`,
    })

    const result = transformTanStackRouter({ content })

    expect(result).toEqual({
      reason: 'The routeTree option must reference the generated route tree import.',
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
