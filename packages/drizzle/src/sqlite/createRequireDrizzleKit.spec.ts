import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import nodeModule from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

import { createRequireDrizzleKit as createPostgresRequireDrizzleKit } from '../postgres/requireDrizzleKit.js'
import { createRequireDrizzleKit as createSQLiteRequireDrizzleKit } from './createRequireDrizzleKit.js'

const directories: string[] = []

afterEach(() => {
  const require = nodeModule.createRequire(import.meta.url)

  for (const directory of directories.splice(0)) {
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(`${directory}${path.sep}`)) {
        delete require.cache[filename]
      }
    }
    rmSync(directory, { force: true, recursive: true })
  }
})

describe.each([
  { createRequireDrizzleKit: createSQLiteRequireDrizzleKit, dialect: 'sqlite' },
  { createRequireDrizzleKit: createPostgresRequireDrizzleKit, dialect: 'postgres' },
])('createRequireDrizzleKit ($dialect)', ({ createRequireDrizzleKit, dialect }) => {
  it('should defer resolving tooling until the adapter requests it', async () => {
    const directory = createDirectory()
    const load = createRequireDrizzleKit({
      from: pathToFileURL(path.join(directory, 'adapter.js')).href,
    })

    await expect(load()).rejects.toThrow(/drizzle-kit/)
    installTooling({ dialect, directory })

    expect((await load()).generateDrizzleJson({})).toEqual({ dialect, source: directory })
  })

  it('should resolve tooling from each owning adapter instead of the shared package', async () => {
    for (let index = 0; index < 2; index++) {
      const directory = createDirectory()

      installTooling({ dialect, directory })

      const load = createRequireDrizzleKit({
        from: pathToFileURL(path.join(directory, 'adapter.js')).href,
      })

      expect((await load()).generateDrizzleJson({})).toEqual({ dialect, source: directory })
    }
  })
})

function createDirectory() {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), 'payload-kit-loader-')))

  directories.push(directory)
  return directory
}

function installTooling({ dialect, directory }: { dialect: string; directory: string }) {
  const packageDirectory = path.join(directory, 'node_modules', 'drizzle-kit')

  mkdirSync(packageDirectory, { recursive: true })
  writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({ exports: { './api': './api.cjs' }, name: 'drizzle-kit' }),
  )
  writeFileSync(
    path.join(packageDirectory, 'api.cjs'),
    `exports.${dialect === 'sqlite' ? 'generateSQLiteDrizzleJson' : 'generateDrizzleJson'} = () => ({ dialect: ${JSON.stringify(dialect)}, source: ${JSON.stringify(directory)} })`,
  )
}
