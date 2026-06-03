import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const spawnMock = vi.fn(() => ({ on: vi.fn() }))
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
    const onMock = vi.fn()
    spawnMock.mockReturnValueOnce({ on: onMock })

    await build({ config: fakeConfig })

    expect(spawnMock).toHaveBeenCalledTimes(1)
    const [execPath, spawnArgs, opts] = spawnMock.mock.calls[0]
    expect(execPath).toBe(process.execPath)
    expect(spawnArgs[1]).toBe('build')
    expect(spawnArgs).toContain('--turbopack')
    expect(opts).toEqual({ stdio: 'inherit' })

    // Simulate the child exiting with a non-zero code
    const exitHandler = onMock.mock.calls.find(([event]) => event === 'exit')?.[1]
    exitHandler(2)
    expect(exitMock).toHaveBeenCalledWith(2)
  })
})
