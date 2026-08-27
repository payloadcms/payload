import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TanStackAppDetails } from '../../types.js'

import { applyPreparedWrites, prepareTanStackInit } from './prepare.js'

const routerContent = `import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
`

const rootRouteContent = `import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
    meta: [{ title: 'Host app' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
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

const templateFiles = {
  'routes/_payload.tsx': 'export const payloadLayout = true\n',
  'routes/_payload/admin.$.tsx': 'export const payloadAdminSplat = true\n',
  'routes/_payload/admin.index.tsx': 'export const payloadAdminIndex = true\n',
  'routes/_payload/api.$.ts': 'export const payloadApi = true\n',
  'routes/_payload/importMap.js': 'export const importMap = {}\n',
  'routes/_payload/server.functions.ts': 'export const payloadServerFunctions = true\n',
  'src/collections/Folders.ts': "export const Folders = { slug: 'folders' }\n",
  'src/collections/Media.ts': "export const Media = { slug: 'media' }\n",
  'src/collections/Tags.ts': "export const Tags = { slug: 'tags' }\n",
  'src/collections/Users.ts': "export const Users = { slug: 'users' }\n",
  'src/payload-foundation.css': '@layer payload-default, payload;\n',
  'src/payload.css': "@import '@payloadcms/ui/css/app.css';\n",
  'src/payload.config.ts': 'export default { collections: [] }\n',
}

describe('prepareTanStackInit', () => {
  let appDetails: TanStackAppDetails
  let projectDir: string
  let templateRoot: string

  beforeEach(() => {
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-prepare-tanstack-project-'))
    templateRoot = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-prepare-tanstack-template-'))

    writeFiles({
      root: projectDir,
      files: {
        'src/router.tsx': routerContent,
        'src/routes/__root.tsx': rootRouteContent,
        'vite.config.ts': viteConfigContent,
      },
    })
    writeFiles({ files: templateFiles, root: templateRoot })

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
    fse.removeSync(templateRoot)
  })

  it('should prepare every host transformation and Payload-owned file without writing to disk', async () => {
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result.success).toBe(true)
    expect(snapshotDirectory(projectDir)).toEqual(before)

    if (!result.success) {
      throw new Error(result.reason)
    }

    expect(result.writes.map(({ filePath }) => path.relative(projectDir, filePath)).sort()).toEqual(
      [
        'src/collections/Folders.ts',
        'src/collections/Media.ts',
        'src/collections/Tags.ts',
        'src/collections/Users.ts',
        'src/payload-foundation.css',
        'src/payload.config.ts',
        'src/payload.css',
        'src/router.tsx',
        'src/routes/__root.tsx',
        'src/routes/_payload.tsx',
        'src/routes/_payload/admin.$.tsx',
        'src/routes/_payload/admin.index.tsx',
        'src/routes/_payload/api.$.ts',
        'src/routes/_payload/importMap.js',
        'src/routes/_payload/server.functions.ts',
        'vite.config.ts',
      ],
    )
    expect(
      getPreparedContent({ filePath: appDetails.viteConfigPath, writes: result.writes }),
    ).toContain('withPayload(')
    expect(
      getPreparedContent({ filePath: appDetails.routerPath, writes: result.writes }),
    ).toContain('parseSearch: payloadParseSearch')
    expect(
      getPreparedContent({ filePath: appDetails.rootRoutePath, writes: result.writes }),
    ).toContain('withPayloadRoot(')
    expect(
      getPreparedContent({
        filePath: path.join(appDetails.routesDir, '_payload/api.$.ts'),
        writes: result.writes,
      }),
    ).toBe(templateFiles['routes/_payload/api.$.ts'])
  })

  it('should reject a non-identical Payload-owned file collision without writing to disk', async () => {
    fse.outputFileSync(path.join(appDetails.routesDir, '_payload.tsx'), 'custom route\n')
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result).toEqual({
      reason: `A different file already exists at ${path.join(appDetails.routesDir, '_payload.tsx')}.`,
      success: false,
    })
    expect(snapshotDirectory(projectDir)).toEqual(before)
  })

  it('should reject a host file that cannot be transformed without writing to disk', async () => {
    fse.writeFileSync(appDetails.routerPath, 'export function getRouter() {}\n')
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result).toEqual({
      reason: `Could not transform ${appDetails.routerPath}: Could not identify the createRouter import.`,
      success: false,
    })
    expect(snapshotDirectory(projectDir)).toEqual(before)
  })

  it('should reject a missing required template file without writing to disk', async () => {
    fse.removeSync(path.join(templateRoot, 'src/payload.config.ts'))
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result).toEqual({
      reason: `Required TanStack template file is missing: ${path.join(templateRoot, 'src/payload.config.ts')}.`,
      success: false,
    })
    expect(snapshotDirectory(projectDir)).toEqual(before)
  })

  it('should reject a missing nested Payload route without writing to disk', async () => {
    const missingFilePath = path.join(templateRoot, 'routes/_payload/server.functions.ts')
    fse.removeSync(missingFilePath)
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result).toEqual({
      reason: `Required TanStack template file is missing: ${missingFilePath}.`,
      success: false,
    })
    expect(snapshotDirectory(projectDir)).toEqual(before)
  })

  it('should reject a missing collection without writing to disk', async () => {
    const missingFilePath = path.join(templateRoot, 'src/collections/Folders.ts')
    fse.removeSync(missingFilePath)
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result).toEqual({
      reason: `Required TanStack template file is missing: ${missingFilePath}.`,
      success: false,
    })
    expect(snapshotDirectory(projectDir)).toEqual(before)
  })

  it('should accept an identical Payload-owned file and omit it from the write set', async () => {
    const identicalFilePath = path.join(appDetails.routesDir, '_payload.tsx')
    fse.outputFileSync(identicalFilePath, templateFiles['routes/_payload.tsx'])
    const before = snapshotDirectory(projectDir)

    const result = await prepareTanStackInit({ appDetails, templateRoot })

    expect(result.success).toBe(true)
    expect(snapshotDirectory(projectDir)).toEqual(before)

    if (!result.success) {
      throw new Error(result.reason)
    }

    expect(result.writes.some(({ filePath }) => filePath === identicalFilePath)).toBe(false)
  })
})

describe('applyPreparedWrites', () => {
  let projectDir: string

  beforeEach(() => {
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-apply-tanstack-writes-'))
  })

  afterEach(() => {
    fse.removeSync(projectDir)
  })

  it('should create parent directories and write the exact prepared content', async () => {
    const writes = [
      {
        content: 'export const value = "preserve exact quotes"\n',
        filePath: path.join(projectDir, 'nested/deep/file.ts'),
      },
      {
        content: '@layer payload;\n',
        filePath: path.join(projectDir, 'src/payload-foundation.css'),
      },
    ]

    await applyPreparedWrites({ writes })

    expect(fse.readFileSync(writes[0]!.filePath, 'utf8')).toBe(writes[0]!.content)
    expect(fse.readFileSync(writes[1]!.filePath, 'utf8')).toBe(writes[1]!.content)
  })
})

function getPreparedContent({
  filePath,
  writes,
}: {
  filePath: string
  writes: { content: string; filePath: string }[]
}) {
  const write = writes.find((candidate) => candidate.filePath === filePath)

  if (!write) {
    throw new Error(`No prepared write found for ${filePath}.`)
  }

  return write.content
}

function snapshotDirectory(root: string): Record<string, string> {
  if (!fse.pathExistsSync(root)) {
    return {}
  }

  return fse
    .readdirSync(root)
    .sort()
    .reduce<Record<string, string>>((snapshot, entry) => {
      const filePath = path.join(root, entry)
      const relativePath = path.relative(root, filePath)

      if (fse.statSync(filePath).isDirectory()) {
        for (const [nestedPath, content] of Object.entries(snapshotDirectory(filePath))) {
          snapshot[path.join(relativePath, nestedPath)] = content
        }
      } else {
        snapshot[relativePath] = fse.readFileSync(filePath, 'utf8')
      }

      return snapshot
    }, {})
}

function writeFiles({ files, root }: { files: Record<string, string>; root: string }) {
  for (const [relativePath, content] of Object.entries(files)) {
    fse.outputFileSync(path.join(root, relativePath), content)
  }
}
