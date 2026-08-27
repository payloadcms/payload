import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Default fake child auto-fires `close(0)` so ordering/generation tests resolve.
// Specific tests override via `mockReturnValueOnce` to drive close/error manually.
const spawnMock = vi.fn((_command: string, _args: string[], _options: object) => ({
  on() {
    return this
  },
  once(event: string, cb: (code?: number | null, signal?: NodeJS.Signals | null) => void) {
    if (event === 'close') {
      cb(0, null)
    }
    return this
  },
}))
const generateImportMapMock = vi.fn(async () => {})
const generateTypesMock = vi.fn(async () => {})

vi.mock('node:child_process', () => ({ spawn: spawnMock }))
vi.mock('../generateImportMap/generateImportMap.js', () => ({
  generateImportMap: generateImportMapMock,
}))
vi.mock('../generateTypes.js', () => ({ generateTypes: generateTypesMock }))

// Imported after mocks are registered
const { build, detectFramework, resolveBuildCommand, resolveNextBin, resolveViteBin } =
  await import('./build.js')

const fakeConfig = {} as never

describe('resolveNextBin', () => {
  it('resolves next bin from the current project', () => {
    // next is installed at the repo root; resolving from cwd must succeed
    const binPath = resolveNextBin(process.cwd())
    expect(binPath).toMatch(/next[\\/].*bin[\\/]next$/)
    expect(existsSync(binPath)).toBe(true)
  })

  it('throws a clear error when next cannot be resolved', () => {
    expect(() => resolveNextBin('/nonexistent-project-root')).toThrow(/next/i)
  })
})

describe('resolveViteBin', () => {
  it('resolves the vite bin from the current project', () => {
    // vite is installed at the repo root; resolving from cwd must succeed
    const binPath = resolveViteBin(process.cwd())
    expect(binPath).toMatch(/vite[\\/].*bin[\\/]vite\.js$/)
    expect(existsSync(binPath)).toBe(true)
  })

  it('throws a clear error when vite cannot be resolved', async () => {
    // Vitest injects its own transitive `vite` dep onto NODE_PATH, so resolving
    // "vite" from any cwd would otherwise succeed in this test process even
    // when the project under test has no vite installed. Mock module
    // resolution itself to simulate a real "vite not installed" project.
    vi.resetModules()
    vi.doMock('node:module', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:module')>()
      return {
        ...actual,
        createRequire: () => ({
          resolve: () => {
            throw new Error('Cannot find module')
          },
        }),
      }
    })

    const { resolveViteBin: resolveViteBinWithoutVite } = await import('./build.js')
    expect(() => resolveViteBinWithoutVite('/nonexistent-project-root')).toThrow(/vite/i)

    vi.doUnmock('node:module')
    vi.resetModules()
  })
})

describe('resolveBuildCommand', () => {
  it('maps next to the next bin and build args', () => {
    const { args, bin } = resolveBuildCommand({
      cwd: process.cwd(),
      forwardedArgs: ['--turbopack'],
      framework: 'next',
    })
    expect(bin).toMatch(/next[\\/].*bin[\\/]next$/)
    expect(args).toEqual(['build', '--turbopack'])
  })

  it('maps tanstack-start to the vite bin and build args', () => {
    const { args, bin } = resolveBuildCommand({
      cwd: process.cwd(),
      forwardedArgs: ['--mode', 'staging'],
      framework: 'tanstack-start',
    })
    expect(bin).toMatch(/vite[\\/].*bin[\\/]vite\.js$/)
    expect(args).toEqual(['build', '--mode', 'staging'])
  })
})

// Resolution against isolated fixture projects, complementing the cwd/real-install
// checks above. Installing a fake package into a real temp node_modules proves
// `createRequire` walks the consumer's node_modules rather than repo hoisting or
// vitest's ambient NODE_PATH, and exercises bin-field shapes the real installs don't.
describe('bin resolution walks the consumer project node_modules', () => {
  const binFixtureDirs: string[] = []

  /**
   * Build a throwaway project with a fake installed package whose package.json
   * carries the given `bin` field. Returns the project root to pass as `cwd`. The
   * bin target file is created so existsSync assertions are meaningful.
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
    const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'payload-build-bin-')))
    binFixtureDirs.push(root)
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
    for (const dir of binFixtureDirs) {
      rmSync(dir, { force: true, recursive: true })
    }
    binFixtureDirs.length = 0
  })

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

describe('build', () => {
  let originalFrameworkEnv: string | undefined
  let cwdSpy: ReturnType<typeof vi.spyOn> | undefined
  const buildTempDirs: string[] = []

  beforeEach(() => {
    spawnMock.mockClear()
    generateImportMapMock.mockClear()
    generateTypesMock.mockClear()
    originalFrameworkEnv = process.env.PAYLOAD_FRAMEWORK
    // Force next for the legacy tests so they don't depend on the repo-root
    // package.json's ambient `next` dependency for auto-detection.
    process.env.PAYLOAD_FRAMEWORK = 'next'
  })

  afterEach(() => {
    if (originalFrameworkEnv === undefined) {
      delete process.env.PAYLOAD_FRAMEWORK
    } else {
      process.env.PAYLOAD_FRAMEWORK = originalFrameworkEnv
    }
    if (cwdSpy) {
      cwdSpy.mockRestore()
      cwdSpy = undefined
    }
    for (const dir of buildTempDirs) {
      rmSync(dir, { force: true, recursive: true })
    }
    buildTempDirs.length = 0
  })

  it('generates the import map before spawning, and generates types by default', async () => {
    await build({ config: fakeConfig })

    expect(generateImportMapMock).toHaveBeenCalledTimes(1)
    expect(generateTypesMock).toHaveBeenCalledTimes(1)
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(generateImportMapMock.mock.invocationCallOrder[0]).toBeLessThan(
      spawnMock.mock.invocationCallOrder[0],
    )
  })

  it('skips type generation with --no-types', async () => {
    await build({ config: fakeConfig, skipTypes: true })

    expect(generateImportMapMock).toHaveBeenCalledTimes(1)
    expect(generateTypesMock).not.toHaveBeenCalled()
    expect(spawnMock).toHaveBeenCalledTimes(1)
  })

  it('returns 1 and does not spawn when generation fails', async () => {
    generateImportMapMock.mockRejectedValueOnce(new Error('boom'))

    const exitCode = await build({ config: fakeConfig })

    expect(exitCode).toBe(1)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('spawns next build with forwarded args and propagates the child exit code', async () => {
    let closeCb: ((code: number | null, signal: NodeJS.Signals | null) => void) | undefined
    spawnMock.mockReturnValueOnce({
      on() {
        return this
      },
      once(event: string, cb: (code: number | null, signal: NodeJS.Signals | null) => void) {
        if (event === 'close') {
          closeCb = cb
        }
        return this
      },
    })

    const buildPromise = build({ config: fakeConfig, forwardedArgs: ['--turbopack'] })

    // generation awaits before spawn; let those microtasks settle
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(1))
    const [execPath, spawnArgs, opts] = spawnMock.mock.calls[0]
    expect(execPath).toBe(process.execPath)
    expect(spawnArgs[1]).toBe('build')
    expect(spawnArgs).toContain('--turbopack')
    expect(opts).toEqual({ stdio: 'inherit' })

    // Simulate the child exiting with a non-zero code
    closeCb?.(2, null)
    await expect(buildPromise).resolves.toBe(2)
  })

  it('exits non-zero when the child is terminated by a signal (code null)', async () => {
    let closeCb: ((code: number | null, signal: NodeJS.Signals | null) => void) | undefined
    spawnMock.mockReturnValueOnce({
      on() {
        return this
      },
      once(event: string, cb: (code: number | null, signal: NodeJS.Signals | null) => void) {
        if (event === 'close') {
          closeCb = cb
        }
        return this
      },
    })

    const buildPromise = build({ config: fakeConfig })
    await vi.waitFor(() => expect(closeCb).toBeDefined())

    // A signal kill (e.g. OOM SIGKILL) reports code null; must not become success.
    closeCb?.(null, 'SIGKILL')
    await expect(buildPromise).resolves.toBe(1)
  })

  it('does not exit until the spawned child exits, then propagates its code', async () => {
    let closeCb: ((code: number | null, signal: NodeJS.Signals | null) => void) | undefined
    spawnMock.mockReturnValueOnce({
      on() {
        return this
      },
      once(event: string, cb: (code: number | null, signal: NodeJS.Signals | null) => void) {
        if (event === 'close') {
          closeCb = cb
        }
        return this
      },
    })

    let resolved = false
    const buildPromise = build({ config: fakeConfig }).then((exitCode) => {
      resolved = true
      return exitCode
    })

    // Wait for generation to settle and the child to be spawned. build() must
    // still be pending because the child has not exited yet.
    await vi.waitFor(() => expect(closeCb).toBeDefined())
    // Flush all pending microtasks; the OLD (buggy) build() resolved here
    // without awaiting the child, so this assertion catches the race.
    await new Promise((r) => setTimeout(r, 0))
    expect(resolved).toBe(false)

    // Child exits non-zero -> build() must return that exact code
    closeCb?.(3, null)
    const exitCode = await buildPromise
    expect(resolved).toBe(true)
    expect(exitCode).toBe(3)
  })

  it('spawns vite build for a detected tanstack project', async () => {
    delete process.env.PAYLOAD_FRAMEWORK
    const tanstackDir = mkdtempSync(path.join(os.tmpdir(), 'payload-build-ts-'))
    buildTempDirs.push(tanstackDir)
    writeFileSync(
      path.join(tanstackDir, 'package.json'),
      JSON.stringify({ dependencies: { '@tanstack/react-start': '1.168.26' } }),
    )
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tanstackDir)

    await build({ config: fakeConfig, forwardedArgs: ['--mode', 'staging'] })

    expect(spawnMock).toHaveBeenCalledTimes(1)
    const [, spawnArgs] = spawnMock.mock.calls[0]
    expect(spawnArgs[0]).toMatch(/vite[\\/].*bin[\\/]vite\.js$/)
    expect(spawnArgs.slice(1)).toEqual(['build', '--mode', 'staging'])
  })

  it('returns 1 and does not spawn when the framework cannot be detected', async () => {
    delete process.env.PAYLOAD_FRAMEWORK
    const emptyDir = mkdtempSync(path.join(os.tmpdir(), 'payload-build-empty-'))
    buildTempDirs.push(emptyDir)
    writeFileSync(path.join(emptyDir, 'package.json'), JSON.stringify({}))
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(emptyDir)

    const exitCode = await build({ config: fakeConfig })

    expect(exitCode).toBe(1)
    expect(spawnMock).not.toHaveBeenCalled()
  })
})

describe('detectFramework', () => {
  const createdDirs: string[] = []
  let originalFrameworkEnv: string | undefined

  const makeProject = (files: { contents?: string; path: string }[]): string => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'payload-build-'))
    createdDirs.push(dir)
    for (const file of files) {
      const full = path.join(dir, file.path)
      mkdirSync(path.dirname(full), { recursive: true })
      writeFileSync(full, file.contents ?? '')
    }
    return dir
  }

  const pkg = (deps: Record<string, string>): string => JSON.stringify({ dependencies: deps })

  beforeEach(() => {
    originalFrameworkEnv = process.env.PAYLOAD_FRAMEWORK
    delete process.env.PAYLOAD_FRAMEWORK
  })

  afterEach(() => {
    if (originalFrameworkEnv === undefined) {
      delete process.env.PAYLOAD_FRAMEWORK
    } else {
      process.env.PAYLOAD_FRAMEWORK = originalFrameworkEnv
    }
    for (const dir of createdDirs) {
      rmSync(dir, { force: true, recursive: true })
    }
    createdDirs.length = 0
  })

  it('honors PAYLOAD_FRAMEWORK=tanstack-start over auto-detection', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    const dir = makeProject([{ contents: pkg({ next: '15.0.0' }), path: 'package.json' }])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('honors PAYLOAD_FRAMEWORK=next over auto-detection', () => {
    process.env.PAYLOAD_FRAMEWORK = 'next'
    const dir = makeProject([
      { contents: pkg({ '@tanstack/react-start': '1.168.26' }), path: 'package.json' },
    ])
    expect(detectFramework(dir)).toBe('next')
  })

  it('throws when PAYLOAD_FRAMEWORK is an unsupported value', () => {
    process.env.PAYLOAD_FRAMEWORK = 'svelte'
    const dir = makeProject([{ contents: pkg({ next: '15.0.0' }), path: 'package.json' }])
    expect(() => detectFramework(dir)).toThrow(/PAYLOAD_FRAMEWORK/)
  })

  it('detects next from the next dependency', () => {
    const dir = makeProject([{ contents: pkg({ next: '15.0.0' }), path: 'package.json' }])
    expect(detectFramework(dir)).toBe('next')
  })

  it('detects tanstack-start from the @tanstack/react-start dependency', () => {
    const dir = makeProject([
      { contents: pkg({ '@tanstack/react-start': '1.168.26' }), path: 'package.json' },
    ])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('falls back to next.config when deps are inconclusive', () => {
    const dir = makeProject([
      { contents: pkg({}), path: 'package.json' },
      { path: 'next.config.ts' },
    ])
    expect(detectFramework(dir)).toBe('next')
  })

  it('falls back to vite.config when deps are inconclusive', () => {
    const dir = makeProject([
      { contents: pkg({}), path: 'package.json' },
      { path: 'vite.config.ts' },
    ])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('falls back to the (payload) folder convention', () => {
    const dir = makeProject([{ path: 'app/(payload)/admin/page.tsx' }])
    expect(detectFramework(dir)).toBe('next')
  })

  it('falls back to the _payload folder convention', () => {
    const dir = makeProject([{ path: 'app/_payload/route.tsx' }])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('resolves ambiguous deps using the config-file layer', () => {
    const dir = makeProject([
      {
        contents: pkg({ '@tanstack/react-start': '1.168.26', next: '15.0.0' }),
        path: 'package.json',
      },
      { path: 'next.config.ts' },
    ])
    expect(detectFramework(dir)).toBe('next')
  })

  it('resolves ambiguous deps to tanstack-start via the config-file layer', () => {
    const dir = makeProject([
      {
        contents: pkg({ '@tanstack/react-start': '1.168.26', next: '15.0.0' }),
        path: 'package.json',
      },
      { path: 'vite.config.ts' },
    ])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('resolves ambiguous deps and configs via the folder-convention layer', () => {
    const dir = makeProject([
      {
        contents: pkg({ '@tanstack/react-start': '1.168.26', next: '15.0.0' }),
        path: 'package.json',
      },
      { path: 'app/_payload/route.tsx' },
    ])
    expect(detectFramework(dir)).toBe('tanstack-start')
  })

  it('throws a no-framework error when nothing is detected', () => {
    const dir = makeProject([{ contents: pkg({}), path: 'package.json' }])
    expect(() => detectFramework(dir)).toThrow(/Could not determine your framework/)
  })

  it('throws a conflict error when signals stay ambiguous', () => {
    const dir = makeProject([
      {
        contents: pkg({ '@tanstack/react-start': '1.168.26', next: '15.0.0' }),
        path: 'package.json',
      },
      { path: 'next.config.ts' },
      { path: 'vite.config.ts' },
    ])
    expect(() => detectFramework(dir)).toThrow(/conflicting signals/)
  })
})
