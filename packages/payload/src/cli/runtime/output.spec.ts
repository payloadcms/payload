import { Command, CommanderError } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerCLIExitCodeHandler } from './exitCodeHandlers.js'
import { CLICommandError, handleCLIError } from './output.js'

class EnvironmentError extends Error {}

describe('CLI error exit code handlers', () => {
  let unregister: (() => void) | undefined
  let originalExitCode: typeof process.exitCode

  beforeEach(() => {
    originalExitCode = process.exitCode
    vi.stubEnv('PAYLOAD_CLI_JSON', undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    unregister = registerCLIExitCodeHandler({
      handler: (error) => (error instanceof EnvironmentError ? 42 : undefined),
    })
  })

  afterEach(() => {
    unregister?.()
    process.exitCode = originalExitCode
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it.each(['config', 'command'])('should classify a typed %s error', (source) => {
    const cause = new EnvironmentError('Missing platform environment')
    const error =
      source === 'command'
        ? new CLICommandError({ cause, command: 'build', message: cause.message })
        : cause

    handleCLIError({ error })

    expect(process.exitCode).toBe(42)
    expect(console.error).toHaveBeenCalledWith(error)
  })

  it.each([
    { error: new EnvironmentError('Missing platform environment'), exitCode: 42 },
    { error: new Error('Invalid user config'), exitCode: 1 },
  ])(
    'should preserve the JSON diagnostic and exit code $exitCode if a handler throws',
    ({ error, exitCode }) => {
      unregister?.()
      const removeThrowingHandler = registerCLIExitCodeHandler({
        handler: () => {
          throw new Error('Classifier failed')
        },
      })

      unregister = registerCLIExitCodeHandler({
        handler: (error) => (error instanceof EnvironmentError ? 42 : undefined),
      })

      try {
        const output = vi.fn()
        const cli = new Command().option('--json').configureOutput({ writeOut: output })

        cli.setOptionValueWithSource('json', true, 'cli')
        handleCLIError({ cli, error })

        expect(process.exitCode).toBe(exitCode)
        expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
          error: { code: 'COMMAND_FAILED', message: error.message },
          success: false,
        })
        expect(console.error).not.toHaveBeenCalled()
      } finally {
        removeThrowingHandler()
      }
    },
  )

  it('should leave ordinary errors and arbitrary causes unclassified', () => {
    const error = new Error('Invalid user config', {
      cause: new EnvironmentError('Unrelated cause'),
    })

    handleCLIError({ error })

    expect(process.exitCode).toBe(1)
  })

  it.each([0, 2])('should preserve Commander exit code %s', (exitCode) => {
    const error = new CommanderError(exitCode, 'commander.test', 'Commander output')

    handleCLIError({ error })

    expect(process.exitCode).toBe(exitCode)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('should remove repeated registrations independently', () => {
    unregister?.()
    const handler = () => 42
    const removeFirst = registerCLIExitCodeHandler({ handler })

    unregister = registerCLIExitCodeHandler({ handler })
    removeFirst()
    removeFirst()

    const error = new EnvironmentError('Missing platform environment')

    handleCLIError({ error })
    expect(process.exitCode).toBe(42)

    unregister()
    handleCLIError({ error })

    expect(process.exitCode).toBe(1)
  })

  it.each([0, 256, 1.5])('should not use invalid failure exit code %s', (exitCode) => {
    unregister?.()
    unregister = registerCLIExitCodeHandler({ handler: () => exitCode })
    handleCLIError({ error: new Error('Invalid user config') })

    expect(process.exitCode).toBe(1)
  })
})
