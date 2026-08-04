import fse from 'fs-extra'
import * as os from 'node:os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getTanStackAppDetails } from './detect.js'

type Fixture = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  hasRootRoute?: boolean
  hasRouter?: boolean
  router?: string
  vite?: string
}

describe('getTanStackAppDetails', () => {
  let projectDir: string

  beforeEach(() => {
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'create-payload-app-tanstack-'))
  })

  afterEach(() => {
    fse.removeSync(projectDir)
  })

  function writeFixture({
    dependencies,
    devDependencies,
    hasRootRoute = true,
    hasRouter = true,
    router = 'export function getRouter() {}',
    vite,
  }: Fixture) {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies,
      devDependencies,
      name: 'tanstack-fixture',
    })
    fse.ensureDirSync(path.join(projectDir, 'src/routes'))

    if (hasRouter) {
      fse.writeFileSync(path.join(projectDir, 'src/router.tsx'), router)
    }
    if (hasRootRoute) {
      fse.writeFileSync(path.join(projectDir, 'src/routes/__root.tsx'), 'export {}')
    }
    if (vite) {
      fse.writeFileSync(path.join(projectDir, 'vite.config.ts'), vite)
    }
  }

  it('should detect a conventional TanStack Start project', async () => {
    writeFixture({
      dependencies: { '@tanstack/react-router': 'latest', '@tanstack/react-start': 'latest' },
      vite: `const config = defineConfig({ plugins: [tanstackStart(), viteReact()] })\nexport default config`,
    })

    const result = await getTanStackAppDetails({ projectDir })

    expect(result).toMatchObject({
      compatible: true,
      detected: true,
      details: {
        isPayloadInstalled: false,
        kind: 'start',
        projectDir,
        rootRoutePath: path.join(projectDir, 'src/routes/__root.tsx'),
        routerPath: path.join(projectDir, 'src/router.tsx'),
        routesDir: path.join(projectDir, 'src/routes'),
        sourceDir: path.join(projectDir, 'src'),
        viteConfigPath: path.join(projectDir, 'vite.config.ts'),
      },
    })
  })

  it('should detect a conventional Router-only project', async () => {
    writeFixture({
      dependencies: { '@tanstack/react-router': 'latest', payload: 'latest' },
      devDependencies: { '@tanstack/router-plugin': 'latest' },
      vite: `const config = defineConfig({ plugins: [tanstackRouter({ target: 'react' }), viteReact()] })\nexport default config`,
    })

    expect(await getTanStackAppDetails({ projectDir })).toMatchObject({
      compatible: true,
      detected: true,
      details: { isPayloadInstalled: true, kind: 'router-only' },
    })
  })

  it('should ignore projects that only use TanStack Query', async () => {
    writeFixture({ dependencies: { '@tanstack/react-query': 'latest' } })

    await expect(getTanStackAppDetails({ projectDir })).resolves.toEqual({ detected: false })
  })

  it('should report a missing root route in a recognized host', async () => {
    writeFixture({
      dependencies: { '@tanstack/react-router': 'latest' },
      devDependencies: { '@tanstack/router-plugin': 'latest' },
      hasRootRoute: false,
      vite: 'export default defineConfig({ plugins: [tanstackRouter()] })',
    })

    await expect(getTanStackAppDetails({ projectDir })).resolves.toMatchObject({
      compatible: false,
      detected: true,
      reason: expect.stringContaining('src/routes/__root'),
    })
  })

  it('should report a router without getRouter in a recognized host', async () => {
    writeFixture({
      dependencies: { '@tanstack/react-router': 'latest' },
      devDependencies: { '@tanstack/router-plugin': 'latest' },
      router: 'export const router = createRouter({})',
      vite: 'export default defineConfig({ plugins: [tanstackRouter()] })',
    })

    await expect(getTanStackAppDetails({ projectDir })).resolves.toMatchObject({
      compatible: false,
      detected: true,
      reason: expect.stringContaining('getRouter'),
    })
  })

  it('should report unsupported Solid hosts', async () => {
    writeFixture({
      dependencies: { '@tanstack/solid-router': 'latest', '@tanstack/solid-start': 'latest' },
      vite: 'export default defineConfig({ plugins: [tanstackStart()] })',
    })

    await expect(getTanStackAppDetails({ projectDir })).resolves.toMatchObject({
      compatible: false,
      detected: true,
      reason: expect.stringContaining('Solid'),
    })
  })

  it('should report ambiguous TanStack Start and Next.js markers', async () => {
    writeFixture({
      dependencies: {
        '@tanstack/react-router': 'latest',
        '@tanstack/react-start': 'latest',
        next: 'latest',
      },
      vite: 'export default defineConfig({ plugins: [tanstackStart()] })',
    })

    await expect(getTanStackAppDetails({ projectDir })).resolves.toMatchObject({
      compatible: false,
      detected: true,
      reason: expect.stringContaining('Next.js'),
    })
  })
})
