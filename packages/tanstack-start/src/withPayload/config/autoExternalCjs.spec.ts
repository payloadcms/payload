import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import { resolveCjsDependencies } from './autoExternalCjs.js'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-auto-external-cjs-'))

const writePackage = ({
  entry = 'index.js',
  entryCode = 'module.exports = {}',
  name,
  packageJson,
}: {
  entry?: string
  entryCode?: string
  name: string
  packageJson: Record<string, unknown>
}) => {
  const directory = path.join(root, 'node_modules', name)

  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ main: entry, name, ...packageJson }),
  )
  fs.writeFileSync(path.join(directory, entry), entryCode)
}

describe('resolveCjsDependencies', () => {
  afterAll(() => {
    fs.rmSync(root, { force: true, recursive: true })
  })

  writePackage({ name: 'cjs-only', packageJson: {} })
  writePackage({ name: 'cjs-dev-only', packageJson: {} })
  writePackage({ entry: 'index.mjs', name: 'esm-only', packageJson: { type: 'module' } })
  writePackage({ name: 'dual', packageJson: { module: 'index.mjs' } })
  writePackage({
    name: 'dual-exports',
    packageJson: { exports: { import: './index.mjs', require: './index.js' } },
  })
  writePackage({
    entryCode: `'use client'\nmodule.exports = {}`,
    name: 'cjs-client-component',
    packageJson: {},
  })
  writePackage({ name: 'excluded', packageJson: {} })
  writePackage({ name: 'react-dom', packageJson: {} })

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'app',
      dependencies: {
        'cjs-client-component': '1.0.0',
        'cjs-only': '1.0.0',
        dual: '1.0.0',
        'dual-exports': '1.0.0',
        'esm-only': '1.0.0',
        excluded: '1.0.0',
        missing: '1.0.0',
        'react-dom': '1.0.0',
      },
      devDependencies: { 'cjs-dev-only': '1.0.0' },
    }),
  )

  const externals = resolveCjsDependencies({ exclude: ['excluded'], root })

  it('should externalize CommonJS-only dependencies', () => {
    expect(externals).toContain('cjs-only')
  })

  it('should externalize CommonJS-only dev dependencies', () => {
    expect(externals).toContain('cjs-dev-only')
  })

  it('should not externalize packages that publish an ESM entry', () => {
    expect(externals).not.toContain('esm-only')
    expect(externals).not.toContain('dual')
    expect(externals).not.toContain('dual-exports')
  })

  it('should not externalize client component packages', () => {
    expect(externals).not.toContain('cjs-client-component')
  })

  it('should not externalize excluded or framework-owned packages', () => {
    expect(externals).not.toContain('excluded')
    expect(externals).not.toContain('react-dom')
  })

  it('should ignore dependencies that cannot be resolved', () => {
    expect(externals).not.toContain('missing')
  })

  it('should return an empty list when the app has no package.json', () => {
    expect(resolveCjsDependencies({ exclude: [], root: path.join(root, 'nope') })).toEqual([])
  })
})
