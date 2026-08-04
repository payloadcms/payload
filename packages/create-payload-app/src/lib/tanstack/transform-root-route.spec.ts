import { describe, expect, it } from 'vitest'

import { transformTanStackRootRoute } from './transform-root-route.js'

function expectSuccessfulTransform(result: ReturnType<typeof transformTanStackRootRoute>) {
  expect(result.success).toBe(true)

  if (!result.success) {
    throw new Error(result.reason)
  }

  return result
}

function getStartRoot({
  appCssHref = 'appCss',
  extraImports = '',
  shellComponent = 'RootDocument',
}: {
  appCssHref?: string
  extraImports?: string
  shellComponent?: string
} = {}) {
  return `import { createRootRoute as createAppRoot, HeadContent, Scripts } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { ThemeProvider } from './theme-provider'
${extraImports}

export const Route = createAppRoot({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Custom title' },
    ],
    links: [
      { rel: 'stylesheet', href: ${appCssHref} },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: ${shellComponent},
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="black" />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
`
}

function getRouterOnlyRoot({
  extraImports = '',
  stylesheetImport = `import '../styles.css'`,
}: {
  extraImports?: string
  stylesheetImport?: string
} = {}) {
  return `import { createRootRoute as createAppRoot, Outlet } from '@tanstack/react-router'
import { AuthProvider } from './auth-provider'
${stylesheetImport}
${extraImports}

export const Route = createAppRoot({
  component: RootComponent,
  head: () => ({
    meta: [{ title: 'Router app' }],
    links: [{ rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
  }),
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <AuthProvider>
      <main data-layout="custom">
        <Outlet />
      </main>
    </AuthProvider>
  )
}
`
}

describe('transformTanStackRootRoute', () => {
  it('should wrap the official Start shell and isolate its app stylesheet from admin', () => {
    const result = expectSuccessfulTransform(
      transformTanStackRootRoute({ content: getStartRoot(), kind: 'start' }),
    )

    expect(result.modified).toBe(true)
    expect(result.content).toContain(
      "import { withPayloadRoot } from '@payloadcms/tanstack-start/client'",
    )
    expect(result.content).toContain('shellComponent: withPayloadRoot(RootDocument)')
    expect(result.content).not.toContain("{ rel: 'stylesheet', href: appCss }")
    expect(result.content).toContain('<link href={appCss} rel="stylesheet" />')
    expect(result.content.indexOf('<link href={appCss}')).toBeLessThan(
      result.content.indexOf('<HeadContent />'),
    )
  })

  it('should preserve Start metadata, non-stylesheet links, components, and providers', () => {
    const result = expectSuccessfulTransform(
      transformTanStackRootRoute({ content: getStartRoot(), kind: 'start' }),
    )

    expect(result.content).toContain("{ charSet: 'utf-8' }")
    expect(result.content).toContain(
      "{ name: 'viewport', content: 'width=device-width, initial-scale=1' }",
    )
    expect(result.content).toContain("{ title: 'Custom title' }")
    expect(result.content).toContain("{ rel: 'preconnect', href: 'https://fonts.googleapis.com' }")
    expect(result.content).toContain('notFoundComponent: NotFound')
    expect(result.content).toContain('<meta name="theme-color" content="black" />')
    expect(result.content).toContain('<ThemeProvider>{children}</ThemeProvider>')
  })

  it('should convert the official Router-only root without replacing its route component', () => {
    const result = expectSuccessfulTransform(
      transformTanStackRootRoute({ content: getRouterOnlyRoot(), kind: 'router-only' }),
    )

    expect(result.modified).toBe(true)
    expect(result.content).toContain("import appCss from '../styles.css?url'")
    expect(result.content).not.toContain("import '../styles.css'")
    expect(result.content).toContain('component: RootComponent')
    expect(result.content).toContain('shellComponent: withPayloadRoot(RootDocument)')
    expect(result.content).toContain('function RootComponent()')
    expect(result.content).toContain('<AuthProvider>')
    expect(result.content).toContain('<Outlet />')
    expect(result.content).toContain(
      'function RootDocument({ children }: { children: React.ReactNode })',
    )
    expect(result.content).toContain('<html lang="en" suppressHydrationWarning>')
    expect(result.content).toContain('<link href={appCss} rel="stylesheet" />')
    expect(result.content).toContain('<HeadContent />')
    expect(result.content).toContain('{children}')
    expect(result.content).toContain('<Scripts />')
  })

  it('should preserve Router-only metadata, non-stylesheet links, and route options', () => {
    const result = expectSuccessfulTransform(
      transformTanStackRootRoute({ content: getRouterOnlyRoot(), kind: 'router-only' }),
    )

    expect(result.content).toContain("meta: [{ title: 'Router app' }]")
    expect(result.content).toContain(
      "links: [{ rel: 'preconnect', href: 'https://fonts.googleapis.com' }]",
    )
    expect(result.content).toContain('notFoundComponent: NotFound')
    expect(result.content).toContain('<main data-layout="custom">')
  })

  it('should not add withPayloadRoot to an unrelated type-only client import', () => {
    const result = expectSuccessfulTransform(
      transformTanStackRootRoute({
        content: getRouterOnlyRoot({
          extraImports: `import type { ClientOptions } from '@payloadcms/tanstack-start/client'`,
        }),
        kind: 'router-only',
      }),
    )

    expect(result.content).toContain(
      "import { withPayloadRoot } from '@payloadcms/tanstack-start/client'",
    )
    expect(result.content).toContain(
      "import type { ClientOptions } from '@payloadcms/tanstack-start/client'",
    )
  })

  it.each([
    ['start' as const, getStartRoot()],
    ['router-only' as const, getRouterOnlyRoot()],
  ])('should report an already transformed %s root as unmodified', (kind, content) => {
    const firstResult = expectSuccessfulTransform(transformTanStackRootRoute({ content, kind }))
    const secondResult = expectSuccessfulTransform(
      transformTanStackRootRoute({ content: firstResult.content, kind }),
    )

    expect(secondResult).toEqual({ content: firstResult.content, modified: false, success: true })
  })

  it.each([
    ['start' as const, getStartRoot()],
    ['router-only' as const, getRouterOnlyRoot()],
  ])(
    'should restore a missing withPayloadRoot import in a transformed %s root',
    (kind, content) => {
      const firstResult = expectSuccessfulTransform(transformTanStackRootRoute({ content, kind }))
      const contentWithoutPayloadImport = firstResult.content.replace(
        /import \{ withPayloadRoot \} from '@payloadcms\/tanstack-start\/client';?\n/,
        '',
      )

      const result = expectSuccessfulTransform(
        transformTanStackRootRoute({ content: contentWithoutPayloadImport, kind }),
      )

      expect(result.modified).toBe(true)
      expect(result.content).toContain(
        "import { withPayloadRoot } from '@payloadcms/tanstack-start/client'",
      )
    },
  )

  it.each([
    ['start' as const, getStartRoot()],
    ['router-only' as const, getRouterOnlyRoot()],
  ])(
    'should reject a transformed %s root with the stylesheet after HeadContent',
    (kind, content) => {
      const firstResult = expectSuccessfulTransform(transformTanStackRootRoute({ content, kind }))
      const reorderedContent = firstResult.content.replace(
        '<link href={appCss} rel="stylesheet" />\n        <HeadContent />',
        '<HeadContent />\n        <link href={appCss} rel="stylesheet" />',
      )

      const result = transformTanStackRootRoute({ content: reorderedContent, kind })

      expect(result.success).toBe(false)
    },
  )

  it('should reject an unrecognized Start shell expression', () => {
    const result = transformTanStackRootRoute({
      content: getStartRoot({ shellComponent: 'createShell(RootDocument)' }),
      kind: 'start',
    })

    expect(result).toEqual({
      reason: 'The existing shellComponent cannot be transformed safely.',
      success: false,
    })
  })

  it('should reject an existing Router-only shell component', () => {
    const content = getRouterOnlyRoot().replace(
      'component: RootComponent,',
      'component: RootComponent,\n  shellComponent: CustomShell,',
    )

    const result = transformTanStackRootRoute({ content, kind: 'router-only' })

    expect(result).toEqual({
      reason: 'The existing shellComponent cannot be transformed safely.',
      success: false,
    })
  })

  it('should reject multiple root route declarations', () => {
    const content = `${getStartRoot()}
export const OtherRoute = createAppRoot({ shellComponent: RootDocument })
`

    const result = transformTanStackRootRoute({ content, kind: 'start' })

    expect(result).toEqual({
      reason: 'Expected exactly one createRootRoute() call.',
      success: false,
    })
  })

  it('should reject a Start stylesheet expression that cannot be relocated', () => {
    const result = transformTanStackRootRoute({
      content: getStartRoot({ appCssHref: 'getStylesheetUrl()' }),
      kind: 'start',
    })

    expect(result).toEqual({
      reason: 'The app stylesheet link cannot be relocated safely.',
      success: false,
    })
  })

  it('should reject multiple Router-only side-effect stylesheet imports', () => {
    const result = transformTanStackRootRoute({
      content: getRouterOnlyRoot({
        stylesheetImport: `import '../base.css'\nimport '../styles.css'`,
      }),
      kind: 'router-only',
    })

    expect(result).toEqual({
      reason: 'Expected exactly one side-effect stylesheet import.',
      success: false,
    })
  })

  it.each([
    ['withPayloadRoot', `const withPayloadRoot = (component: unknown) => component`],
    ['appCss', `const appCss = '/custom.css'`],
    ['RootDocument', `function RootDocument() { return null }`],
    ['HeadContent', `const HeadContent = CustomHead`],
    ['Scripts', `const Scripts = CustomScripts`],
  ])('should reject an incompatible Router-only %s destination binding', (name, binding) => {
    const result = transformTanStackRootRoute({
      content: getRouterOnlyRoot({ extraImports: binding }),
      kind: 'router-only',
    })

    expect(result).toEqual({
      reason: `Identifier "${name}" is already bound incompatibly.`,
      success: false,
    })
  })

  it('should reject a withPayloadRoot import with the wrong provenance', () => {
    const result = transformTanStackRootRoute({
      content: getStartRoot({
        extraImports: `import { withPayloadRoot } from 'custom-shell'`,
      }),
      kind: 'start',
    })

    expect(result).toEqual({
      reason: 'Identifier "withPayloadRoot" is already bound incompatibly.',
      success: false,
    })
  })
})
