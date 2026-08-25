import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadEnvMock = vi.fn()
const findConfigMock = vi.fn()
const migrateMock = vi.fn()

// Mock every collaborator so importing the bin entry stays isolated from the
// payload core and never touches the filesystem or a real config.
vi.mock('./loadEnv.js', () => ({ loadEnv: loadEnvMock }))
vi.mock('../config/find.js', () => ({ findConfig: findConfigMock }))
vi.mock('../index.js', () => ({ default: {}, getPayload: vi.fn() }))
vi.mock('croner', () => ({ Cron: vi.fn() }))
vi.mock('./build.js', () => ({ build: vi.fn() }))
vi.mock('./generateImportMap/index.js', () => ({ generateImportMap: vi.fn() }))
vi.mock('./generateTypes.js', () => ({ generateTypes: vi.fn() }))
vi.mock('./info.js', () => ({ info: vi.fn() }))
vi.mock('./migrate.js', () => ({
  availableCommands: [
    'migrate',
    'migrate:create',
    'migrate:down',
    'migrate:refresh',
    'migrate:reset',
    'migrate:status',
    'migrate:fresh',
  ],
  migrate: migrateMock,
}))

// Imported after mocks are registered
const { bin } = await import('./index.js')

describe('bin', () => {
  let exitMock: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let originalArgv: string[]
  let originalExitCode: typeof process.exitCode

  beforeEach(() => {
    originalArgv = process.argv
    originalExitCode = process.exitCode
    process.exitCode = 0
    loadEnvMock.mockReset()
    findConfigMock.mockReset()
    // Throw from the mock so control stops exactly where the real process.exit would.
    exitMock = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`)
    }) as never)
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.argv = originalArgv
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
  })

  it('defaults process.exitCode to 1 at entry so a never-settling run reports failure', async () => {
    // loadEnv is the first call after the guard; making it throw proves the guard
    // is already in place before any work that could hang or be dropped runs.
    loadEnvMock.mockImplementation(() => {
      throw new Error('boom')
    })
    process.argv = ['node', 'payload', 'migrate']

    await expect(bin()).rejects.toThrow('boom')
    expect(process.exitCode).toBe(1)
  })

  it('exits 1 with a clear message when the config fails to load', async () => {
    findConfigMock.mockImplementation(() => {
      throw new Error('no config found')
    })
    process.argv = ['node', 'payload', 'migrate']

    await expect(bin()).rejects.toThrow('process.exit:1')
    expect(errorSpy).toHaveBeenCalledWith('Failed to load the Payload config.')
    expect(exitMock).toHaveBeenCalledWith(1)
    expect(process.exitCode).toBe(1)
  })
})
