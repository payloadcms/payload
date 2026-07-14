import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { resolveBuildCommand, resolveNextBin, resolveViteBin } from './build.js'

/**
 * Integration coverage for framework-bin resolution against isolated fixture
 * projects. It installs a fake package into a real temp node_modules so it proves
 * `createRequire` actually walks the consumer's node_modules, not repo hoisting or
 * vitest's ambient NODE_PATH. (build.spec.ts covers resolution against the real
 * installed next/vite; it can only mock node:module to simulate a missing
 * dependency, which is why the genuine consumer-tree walk lives here.) No Payload
 * instance is needed, so it runs under the fast `unit` vitest project.
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
    writeFileSync(binFull, '')
  }

  return root
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { force: true, recursive: true })
  }
  tempDirs.length = 0
})

describe('bin resolution walks the consumer project node_modules', () => {
  it('should resolve the next bin from an isolated project using the object-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: { next: './dist/bin/next' },
      binRelPath: 'dist/bin/next',
      packageName: 'next',
    })

    const binPath = resolveNextBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('should resolve the vite bin from an isolated project using the object-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: { vite: 'bin/vite.js' },
      binRelPath: 'bin/vite.js',
      packageName: 'vite',
    })

    const binPath = resolveViteBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('should resolve a string-form bin field', () => {
    const root = makeProjectWithPackage({
      binField: './cli.js',
      binRelPath: 'cli.js',
      packageName: 'vite',
    })

    const binPath = resolveViteBin(root)

    expect(binPath).toBe(path.join(root, 'node_modules', 'vite', 'cli.js'))
    expect(existsSync(binPath)).toBe(true)
  })

  it('should throw a clear error when the package declares no bin field', () => {
    const root = makeProjectWithPackage({ binField: undefined, packageName: 'vite' })

    expect(() => resolveViteBin(root)).toThrow(/binary path/i)
  })
})

describe('resolveBuildCommand maps a framework to its resolved bin', () => {
  it('should map next to the resolved next bin', () => {
    const root = makeProjectWithPackage({
      binField: { next: './dist/bin/next' },
      binRelPath: 'dist/bin/next',
      packageName: 'next',
    })

    const { bin } = resolveBuildCommand({
      cwd: root,
      forwardedArgs: ['--turbopack'],
      framework: 'next',
    })

    expect(bin).toBe(path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'))
    expect(existsSync(bin)).toBe(true)
  })

  it('should map tanstack-start to the resolved vite bin', () => {
    const root = makeProjectWithPackage({
      binField: { vite: 'bin/vite.js' },
      binRelPath: 'bin/vite.js',
      packageName: 'vite',
    })

    const { bin } = resolveBuildCommand({
      cwd: root,
      forwardedArgs: ['--mode', 'staging'],
      framework: 'tanstack-start',
    })

    expect(bin).toBe(path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
    expect(existsSync(bin)).toBe(true)
  })
})
