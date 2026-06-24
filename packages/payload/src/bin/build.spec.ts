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
const { build, getForwardedArgs, resolveNextBin } = await import('./build.js')

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
  })

  it('throws a clear error when next cannot be resolved', () => {
    expect(() => resolveNextBin('/nonexistent-project-root')).toThrow(/next/i)
  })
})

describe('build', () => {
  let exitMock: ReturnType<typeof vi.spyOn>
  let originalArgv: string[]

  beforeEach(() => {
    spawnMock.mockClear()
    generateImportMapMock.mockClear()
    generateTypesMock.mockClear()
    originalArgv = process.argv
    process.argv = ['node', 'payload', 'build']
    exitMock = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
  })

  afterEach(() => {
    process.argv = originalArgv
    exitMock.mockRestore()
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
})
