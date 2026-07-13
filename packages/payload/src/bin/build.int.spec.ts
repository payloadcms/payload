import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { resolveBuildCommand, resolveNextBin, resolveViteBin } from './build.js'

/**
 * Integration coverage for framework-bin resolution. Unlike build.spec.ts, this
 * suite mocks nothing: it resolves the real installed next/vite bins and, for the
 * edge cases, resolves against isolated fixture projects so it proves
 * `createRequire` actually walks the consumer's node_modules (not repo hoisting or
 * vitest's ambient NODE_PATH). No Payload instance is needed, so it runs under the
 * fast `unit` vitest project alongside build.spec.ts.
 */

const tempDirs: string[] = []

/**
 * Build a throwaway project at a temp path with a fake installed package whose
 * package.json carries the given `bin` field. Returns the project root to pass as
 * `cwd`. The bin target file is created so existsSync assertions are meaningful.
 */
const makeProjectWithPackage = ({
  binField,
  binRelPath,
  packageName,
}: {
  binField: unknown
  binRelPath?: string
  packageName: string
}): string => {
  // realpath so exact path comparisons hold on macOS, where /var symlinks to
  // /private/var and require.resolve returns the resolved path.
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'payload-build-int-')))
  tempDirs.push(root)
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture-app' }))

  const pkgDir = path.join(root, 'node_modules', packageName)
  mkdirSync(pkgDir, { recursive: true })
  writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ bin: binField, name: packageName, version: '0.0.0' }),
  )

  if (binRelPath) {
    const binFull = path.join(pkgDir, binRelPath)
    mkdirSync(path.dirname(binFull), { recursive: true })
    writeFileSync(binFull, '#!/usr/bin/env node\n')
  }

  return root
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { force: true, recursive: true })
  }
  tempDirs.length = 0
})

describe('bin resolution against real installs', () => {
  it('resolves the next bin to a file that exists on disk', () => {
    const binPath = resolveNextBin(process.cwd())

    expect(binPath).toMatch(/next[\\/].*bin[\\/]next$/)
    expect(existsSync(binPath)).toBe(true)
  })

  it('resolves the vite bin to a file that exists on disk', () => {
    const binPath = resolveViteBin(process.cwd())

    expect(binPath).toMatch(/vite[\\/].*bin[\\/]vite\.js$/)
    expect(existsSync(binPath)).toBe(true)
  })
})

describe('bin resolution walks the consumer project node_modules', () => {
  it('resolves the next bin from an isolated project using the object-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: { next: './dist/bin/next' },
      binRelPath: 'dist/bin/next',
      packageName: 'next',
    })

    const binPath = resolveNextBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('resolves the vite bin from an isolated project using the object-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: { vite: 'bin/vite.js' },
      binRelPath: 'bin/vite.js',
      packageName: 'vite',
    })

    const binPath = resolveViteBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('resolves a string-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: './cli.js',
      binRelPath: 'cli.js',
      packageName: 'vite',
    })

    const binPath = resolveViteBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'vite', 'cli.js'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('throws a clear error when the package declares no bin field', () => {
    const root = makeProjectWithPackage({ binField: undefined, packageName: 'vite' })

    expect(() => resolveViteBin(root)).toThrow(/binary path/i)
  })
})

describe('resolveBuildCommand resolves real bins end to end', () => {
  it('maps next to an existing next bin', () => {
    const root = makeProjectWithPackage({
      binField: { next: './dist/bin/next' },
      binRelPath: 'dist/bin/next',
      packageName: 'next',
    })

    const { args, bin } = resolveBuildCommand({
      cwd: root,
      forwardedArgs: ['--turbopack'],
      framework: 'next',
    })

    expect(bin).toBe(path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'))
    expect(existsSync(bin)).toBe(true)
    expect(args).toEqual(['build', '--turbopack'])
  })

  it('maps tanstack-start to an existing vite bin', () => {
    const root = makeProjectWithPackage({
      binField: { vite: 'bin/vite.js' },
      binRelPath: 'bin/vite.js',
      packageName: 'vite',
    })

    const { args, bin } = resolveBuildCommand({
      cwd: root,
      forwardedArgs: ['--mode', 'staging'],
      framework: 'tanstack-start',
    })

    expect(bin).toBe(path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
    expect(existsSync(bin)).toBe(true)
    expect(args).toEqual(['build', '--mode', 'staging'])
  })
})
