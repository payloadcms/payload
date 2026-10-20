import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { withPayload } from '../index.js'
import { getPublishedServerExternalPackages } from './devExternal.js'

const directories: string[] = []

function createProject() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-dev-externals-'))

  directories.push(directory)
  return directory
}

function writePackage({
  directory,
  entry = 'dist/index.js',
  name,
}: {
  directory: string
  entry?: string
  name: string
}) {
  const packageDirectory = path.join(directory, 'node_modules', name)

  fs.mkdirSync(path.dirname(path.join(packageDirectory, entry)), { recursive: true })
  fs.writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({ exports: { '.': `./${entry}`, './node': `./${entry}` }, name }),
  )
  fs.writeFileSync(path.join(packageDirectory, entry), 'throw new Error("must not evaluate")')
  return packageDirectory
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true })
  }
})

describe('getPublishedServerExternalPackages', () => {
  it('should externalize installed server packages without evaluating them', () => {
    const directory = createProject()

    writePackage({ directory, name: 'payload' })
    writePackage({ directory, name: '@payloadcms/db-mongodb' })

    expect(
      getPublishedServerExternalPackages({ payloadConfigPath: path.join(directory, 'config.ts') }),
    ).toEqual(['payload', 'payload/node', '@payloadcms/db-mongodb'])
  })

  it('should leave TypeScript workspace packages in the transform graph', () => {
    const directory = createProject()

    writePackage({ directory, entry: 'src/index.ts', name: 'payload' })
    writePackage({ directory, name: '@payloadcms/db-mongodb' })

    expect(
      getPublishedServerExternalPackages({ payloadConfigPath: path.join(directory, 'config.ts') }),
    ).toEqual([])
  })

  it('should leave source adapters in the transform graph when Payload is installed', () => {
    const directory = createProject()

    writePackage({ directory, name: 'payload' })
    writePackage({ directory, entry: 'src/index.ts', name: '@payloadcms/db-mongodb' })

    expect(
      getPublishedServerExternalPackages({ payloadConfigPath: path.join(directory, 'config.ts') }),
    ).toEqual(['payload', 'payload/node'])
  })

  it('should preserve transformation of linked JavaScript source packages', () => {
    const directory = createProject()
    const workspace = createProject()
    const packageDirectory = writePackage({ directory: workspace, name: 'payload' })
    const linkedDirectory = path.join(workspace, 'payload-source')

    fs.renameSync(packageDirectory, linkedDirectory)
    fs.mkdirSync(path.join(directory, 'node_modules'), { recursive: true })
    fs.symlinkSync(linkedDirectory, path.join(directory, 'node_modules', 'payload'), 'dir')

    expect(
      getPublishedServerExternalPackages({ payloadConfigPath: path.join(directory, 'config.ts') }),
    ).toEqual([])
  })

  it('should allow a config whose dependencies are not installed yet', () => {
    const directory = createProject()

    expect(
      getPublishedServerExternalPackages({ payloadConfigPath: path.join(directory, 'config.ts') }),
    ).toEqual([])
  })

  it('should allow consumers to keep installed server packages in Vite', () => {
    const directory = createProject()

    writePackage({ directory, name: 'payload' })

    const config = withPayload(() => ({}), {
      devBundleServerPackages: true,
      payloadConfigPath: path.join(directory, 'config.ts'),
    })({ command: 'serve', mode: 'development' })

    expect(config.ssr?.external).not.toContain('payload')
  })
})
