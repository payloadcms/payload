import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { dynamicImport } from './dynamicImport.js'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('dynamicImport', () => {
  it('should resolve and execute a package subpath relative to the caller', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'payload-dynamic-import-'))
    temporaryDirectories.push(root)

    const packageDirectory = path.join(root, 'node_modules', 'drizzle-kit')
    mkdirSync(packageDirectory, { recursive: true })
    writeFileSync(
      path.join(packageDirectory, 'package.json'),
      JSON.stringify({
        exports: { './api': './api.js' },
        name: 'drizzle-kit',
        type: 'module',
      }),
    )
    writeFileSync(
      path.join(packageDirectory, 'api.js'),
      'export const generateSQLiteDrizzleJson = async (args) => ({ args, source: "adapter" })\n',
    )

    const callerURL = pathToFileURL(path.join(root, 'adapter.js')).href
    const imported = await dynamicImport<{
      generateSQLiteDrizzleJson: (args: object) => Promise<unknown>
    }>('drizzle-kit/api', { from: callerURL })

    await expect(imported.generateSQLiteDrizzleJson({ posts: true })).resolves.toEqual({
      args: { posts: true },
      source: 'adapter',
    })
  })
})
