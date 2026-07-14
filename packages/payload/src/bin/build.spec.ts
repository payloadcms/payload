import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Default fake child auto-fires `exit(0)` synchronously so ordering/generation
// tests resolve. Specific tests override via `mockReturnValueOnce` to drive the
// exit/error handlers manually.
const spawnMock = vi.fn(() => ({
  on(event: string, cb: (arg?: never) => void) {
    if (event === 'exit') {
      cb(0 as never)
    }
    return this
  },
}))
const generateImportMapMock = vi.fn(async () => {})
const generateTypesMock = vi.fn(async () => {})

vi.mock('node:child_process', () => ({ spawn: spawnMock }))
vi.mock('./generateImportMap/index.js', () => ({ generateImportMap: generateImportMapMock }))
vi.mock('./generateTypes.js', () => ({ generateTypes: generateTypesMock }))

// Imported after mocks are registered
const {
  build,
  detectFramework,
  getForwardedArgs,
  resolveBuildCommand,
  resolveNextBin,
  resolveViteBin,
} = await import('./build.js')

const fakeConfig = {} as never

describe('getForwardedArgs', () => {
  it('returns args after the build token and strips --no-types', () => {
    expect(getForwardedArgs(['build', '--turbopack', '--no-types', 'foo'])).toEqual([
      '--turbopack',
      'foo',
    ])
  })

  it('returns empty array when only build is present', () => {
    expect(getForwardedArgs(['build'])).toEqual([])
  })
})

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

describe('build', () => {
  let exitMock: ReturnType<typeof vi.spyOn>
  let originalArgv: string[]
  let originalFrameworkEnv: string | undefined
  let cwdSpy: ReturnType<typeof vi.spyOn> | undefined
  const buildTempDirs: string[] = []

  beforeEach(() => {
    spawnMock.mockClear()
    generateImportMapMock.mockClear()
    generateTypesMock.mockClear()
    originalArgv = process.argv
    process.argv = ['node', 'payload', 'build']
    exitMock = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    originalFrameworkEnv = process.env.PAYLOAD_FRAMEWORK
    // Force next for the legacy tests so they don't depend on the repo-root
    // package.json's ambient `next` dependency for auto-detection.
    process.env.PAYLOAD_FRAMEWORK = 'next'
  })

  afterEach(() => {
    process.argv = originalArgv
    exitMock.mockRestore()
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
    process.argv = ['node', 'payload', 'build', '--no-types']

    await build({ config: fakeConfig })

    expect(generateImportMapMock).toHaveBeenCalledTimes(1)
    expect(generateTypesMock).not.toHaveBeenCalled()
    expect(spawnMock).toHaveBeenCalledTimes(1)
  })

  it('exits 1 and does not spawn when generation fails', async () => {
    generateImportMapMock.mockRejectedValueOnce(new Error('boom'))

    await build({ config: fakeConfig })

    expect(exitMock).toHaveBeenCalledWith(1)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('spawns next build with forwarded args and propagates the child exit code', async () => {
    process.argv = ['node', 'payload', 'build', '--turbopack']
    let exitCb: ((code: number | null) => void) | undefined
    spawnMock.mockReturnValueOnce({
      on(event: string, cb: (code: number | null) => void) {
        if (event === 'exit') {
          exitCb = cb
        }
        return this
      },
    })

    const buildPromise = build({ config: fakeConfig })

    // generation awaits before spawn; let those microtasks settle
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(1))
    const [execPath, spawnArgs, opts] = spawnMock.mock.calls[0]
    expect(execPath).toBe(process.execPath)
    expect(spawnArgs[1]).toBe('build')
    expect(spawnArgs).toContain('--turbopack')
    expect(opts).toEqual({ stdio: 'inherit' })

    // Simulate the child exiting with a non-zero code
    exitCb?.(2)
    await buildPromise
    expect(exitMock).toHaveBeenCalledWith(2)
  })

  it('does not exit until the spawned child exits, then propagates its code', async () => {
    let exitCb: ((code: number | null) => void) | undefined
    spawnMock.mockReturnValueOnce({
      on(event: string, cb: (code: number | null) => void) {
        if (event === 'exit') {
          exitCb = cb
        }
        return this
      },
    })

    let resolved = false
    const buildPromise = build({ config: fakeConfig }).then(() => {
      resolved = true
    })

    // Wait for generation to settle and the child to be spawned. build() must
    // still be pending because the child has not exited yet.
    await vi.waitFor(() => expect(exitCb).toBeDefined())
    // Flush all pending microtasks; the OLD (buggy) build() resolved here
    // without awaiting the child, so this assertion catches the race.
    await new Promise((r) => setTimeout(r, 0))
    expect(resolved).toBe(false)
    expect(exitMock).not.toHaveBeenCalled()

    // Child exits non-zero -> build() must exit with that exact code
    exitCb?.(3)
    await buildPromise
    expect(resolved).toBe(true)
    expect(exitMock).toHaveBeenCalledWith(3)
  })

  it('spawns vite build for a detected tanstack project', async () => {
    delete process.env.PAYLOAD_FRAMEWORK
    process.argv = ['node', 'payload', 'build', '--mode', 'staging']
    const tanstackDir = mkdtempSync(path.join(os.tmpdir(), 'payload-build-ts-'))
    buildTempDirs.push(tanstackDir)
    writeFileSync(
      path.join(tanstackDir, 'package.json'),
      JSON.stringify({ dependencies: { '@tanstack/react-start': '1.168.26' } }),
    )
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tanstackDir)

    await build({ config: fakeConfig })

    expect(spawnMock).toHaveBeenCalledTimes(1)
    const [, spawnArgs] = spawnMock.mock.calls[0]
    expect(spawnArgs[0]).toMatch(/vite[\\/].*bin[\\/]vite\.js$/)
    expect(spawnArgs.slice(1)).toEqual(['build', '--mode', 'staging'])
  })

  it('exits 1 and does not spawn when the framework cannot be detected', async () => {
    delete process.env.PAYLOAD_FRAMEWORK
    const emptyDir = mkdtempSync(path.join(os.tmpdir(), 'payload-build-empty-'))
    buildTempDirs.push(emptyDir)
    writeFileSync(path.join(emptyDir, 'package.json'), JSON.stringify({}))
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(emptyDir)

    await build({ config: fakeConfig })

    expect(exitMock).toHaveBeenCalledWith(1)
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
