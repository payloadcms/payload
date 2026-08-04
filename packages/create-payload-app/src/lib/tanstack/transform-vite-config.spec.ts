import { describe, expect, it } from 'vitest'

import type { TanStackAppDetails } from '../../types.js'

import { transformTanStackViteConfig } from './transform-vite-config.js'

function getAppDetails(kind: TanStackAppDetails['kind']): TanStackAppDetails {
  return {
    isPayloadInstalled: false,
    kind,
    projectDir: '/project',
    rootRoutePath: '/project/src/routes/__root.tsx',
    routerPath: '/project/src/router.tsx',
    routesDir: '/project/src/routes',
    sourceDir: '/project/src',
    viteConfigPath: '/project/vite.config.ts',
  }
}

function expectSuccessfulTransform(result: ReturnType<typeof transformTanStackViteConfig>) {
  expect(result.success).toBe(true)

  if (!result.success) {
    throw new Error(result.reason)
  }

  return result
}

describe('transformTanStackViteConfig', () => {
  it('should transform the official TanStack Start Vite config shape', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )

    expect(result.modified).toBe(true)
    expect(result.content).toContain("import { withPayload } from '@payloadcms/tanstack-start'")
    expect(result.content).toContain("import rsc from '@vitejs/plugin-rsc'")
    expect(result.content).toContain('rsc(pluginOptions.rsc)')
    expect(result.content).toContain('tanstackStart(pluginOptions.tanstackStart)')
    expect(result.content).toContain('viteReact(pluginOptions.react)')
    expect(result.content).toContain("routesDirectory: 'routes'")
    expect(result.content).toContain(
      "payloadConfigPath: path.resolve(__dirname, 'src', 'payload.config.ts')",
    )
  })

  it('should convert the official Router-only Vite config shape', () => {
    const content = `import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
})
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('router-only'), content }),
    )

    expect(result.modified).toBe(true)
    expect(result.content).not.toContain('tanstackRouter')
    expect(result.content).not.toContain('@tanstack/router-plugin')
    expect(result.content).toContain(
      "import { tanstackStart } from '@tanstack/react-start/plugin/vite'",
    )
    expect(result.content).toContain('tanstackStart(pluginOptions.tanstackStart)')
  })

  it('should transform a config variable exported separately', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({ plugins: [tanstackStart(), viteReact()] })

export default config
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )

    expect(result.content).toContain('const config = defineConfig(\n  withPayload(')
    expect(result.content).toContain('export default config')
  })

  it('should preserve original config properties and unrelated plugins', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import inspect from 'vite-plugin-inspect'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), tanstackStart(), viteReact(), inspect()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 4173 },
})
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )

    expect(result.content).toContain('tsconfigPaths()')
    expect(result.content).toContain('inspect()')
    expect(result.content).toContain("resolve: { alias: { '@': '/src' } }")
    expect(result.content).toContain('server: { port: 4173 }')
    expect(result.content.indexOf('tsconfigPaths()')).toBeLessThan(
      result.content.indexOf('rsc(pluginOptions.rsc)'),
    )
    expect(result.content.indexOf('viteReact(pluginOptions.react)')).toBeLessThan(
      result.content.indexOf('inspect()'),
    )
  })

  it('should replace existing custom TanStack and React options with Payload plugin options', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackStart({ router: { quoteStyle: 'double' } }),
    viteReact({ babel: { plugins: ['compiler'] } }),
  ],
})
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )

    expect(result.content).not.toContain("quoteStyle: 'double'")
    expect(result.content).not.toContain("plugins: ['compiler']")
    expect(result.content).toContain('tanstackStart(pluginOptions.tanstackStart)')
    expect(result.content).toContain('viteReact(pluginOptions.react)')
  })

  it('should preserve an existing __dirname declaration without adding fileURLToPath', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

const __dirname = '/project'

export default defineConfig({ plugins: [tanstackStart(), viteReact()] })
`

    const result = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )

    expect(result.content.match(/const __dirname =/g)).toHaveLength(1)
    expect(result.content).not.toContain('fileURLToPath')
    expect(result.content.match(/from 'node:path'/g)).toHaveLength(1)
  })

  it('should report an already transformed config as unmodified', () => {
    const content = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [tanstackStart(), viteReact()] })
`
    const firstResult = expectSuccessfulTransform(
      transformTanStackViteConfig({ appDetails: getAppDetails('start'), content }),
    )
    const secondResult = expectSuccessfulTransform(
      transformTanStackViteConfig({
        appDetails: getAppDetails('start'),
        content: firstResult.content,
      }),
    )

    expect(secondResult).toEqual({ content: firstResult.content, modified: false, success: true })
  })

  it.each([
    {
      content: `export default defineConfig(() => ({ plugins: [tanstackStart(), viteReact()] }))`,
      expectedReason: 'defineConfig() must receive an object literal.',
      name: 'a callback config',
    },
    {
      content: `export default defineConfig({ server: { port: 3000 } })`,
      expectedReason: 'The Vite config must contain a plugins array.',
      name: 'a missing plugins array',
    },
    {
      content: `export default defineConfig({ plugins: [...plugins, tanstackStart(), viteReact()] })`,
      expectedReason: 'Plugin array spreads cannot be transformed safely.',
      name: 'a spread plugin element',
    },
    {
      content: `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({ plugins: [tanstackStart(), tanstackStart(), viteReact()] })`,
      expectedReason: 'Expected exactly one TanStack framework plugin call.',
      name: 'multiple framework calls',
    },
    {
      content: `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({ plugins: [tanstackStart(), viteReact(), viteReact()] })`,
      expectedReason: 'Expected exactly one React plugin call.',
      name: 'multiple React calls',
    },
    {
      content: `defineConfig({ plugins: [] })
export default defineConfig({ plugins: [] })`,
      expectedReason: 'Expected exactly one defineConfig() call.',
      name: 'multiple defineConfig calls',
    },
  ])('should reject $name', ({ content, expectedReason }) => {
    const result = transformTanStackViteConfig({ appDetails: getAppDetails('start'), content })

    expect(result).toEqual({ success: false, reason: expectedReason })
  })

  it('should reject an incompatible existing withPayload call', () => {
    const content = `import { withPayload } from '@payloadcms/tanstack-start'
import { defineConfig } from 'vite'

export default defineConfig(withPayload({ plugins: [] }))
`

    const result = transformTanStackViteConfig({ appDetails: getAppDetails('start'), content })

    expect(result).toEqual({
      success: false,
      reason: 'The existing withPayload() call does not match the supported configuration.',
    })
  })
})
