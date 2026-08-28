import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TanStackAppDetails } from '../types.js'

import { initTanStack } from './init-tanstack.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const mocks = vi.hoisted(() => ({ resolvePackageVersion: vi.fn() }))

vi.mock('../utils/resolvePackageVersion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolvePackageVersion: mocks.resolvePackageVersion,
}))

const routerContent = `import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({ routeTree })
}
`

const rootRouteContent = `import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({ links: [{ rel: 'stylesheet', href: appCss }] }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  )
}
`

const viteConfigContent = `import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
`

describe('initTanStack default template', () => {
  let appDetails: TanStackAppDetails
  let projectDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolvePackageVersion.mockResolvedValue('4.2.0')
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-init-tanstack-default-'))
    writeFiles({
      files: {
        'package.json': JSON.stringify({
          dependencies: {
            '@tanstack/react-router': '^1.200.0',
            '@tanstack/react-start': '^1.200.0',
          },
          name: 'start-app',
        }),
        'src/router.tsx': routerContent,
        'src/routes/__root.tsx': rootRouteContent,
        'tsconfig.json': '{"compilerOptions":{"baseUrl":"."}}\n',
        'vite.config.ts': viteConfigContent,
      },
      root: projectDir,
    })
    appDetails = {
      isPayloadInstalled: false,
      kind: 'start',
      projectDir,
      rootRoutePath: path.join(projectDir, 'src/routes/__root.tsx'),
      routerPath: path.join(projectDir, 'src/router.tsx'),
      routesDir: path.join(projectDir, 'src/routes'),
      sourceDir: path.join(projectDir, 'src'),
      viteConfigPath: path.join(projectDir, 'vite.config.ts'),
    }
  })

  afterEach(() => {
    fse.removeSync(projectDir)
  })

  it('should initialize from the raw source template without a templateRoot override', async () => {
    const rawPayloadLayoutPath = path.resolve(
      dirname,
      '../../../../templates/blank-tanstack/src/app/_payload.tsx',
    )

    const result = await initTanStack({
      '--no-deps': true,
      appDetails,
      dbType: 'mongodb',
      packageManager: 'pnpm',
      projectDir,
    })

    expect(result).toEqual({
      payloadConfigPath: path.join(projectDir, 'src/payload.config.ts'),
      success: true,
    })
    expect(fse.readFileSync(path.join(projectDir, 'src/routes/_payload.tsx'), 'utf8')).toBe(
      fse.readFileSync(rawPayloadLayoutPath, 'utf8'),
    )
  })

  it('should use the UI stylesheet without copying project-level foundations', async () => {
    const result = await initTanStack({
      '--no-deps': true,
      '--payload-version': '4.2.0',
      appDetails,
      dbType: 'mongodb',
      packageManager: 'pnpm',
      projectDir,
    })

    expect(result.success).toBe(true)
    expect(fse.readFileSync(path.join(projectDir, 'src/routes/_payload.tsx'), 'utf8')).toContain(
      "import styles from '../payload.css?url'",
    )
    expect(fse.readFileSync(path.join(projectDir, 'src/payload.css'), 'utf8')).toBe(
      "@import '@payloadcms/ui/css/app.css';\n",
    )
    expect(fse.pathExistsSync(path.join(projectDir, 'src/payload-foundation.css'))).toBe(false)
  })
})

function writeFiles({ files, root }: { files: Record<string, string>; root: string }): void {
  for (const [relativePath, content] of Object.entries(files)) {
    fse.outputFileSync(path.join(root, relativePath), content)
  }
}
