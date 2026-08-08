import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { CLIArgs, Config, SanitizedConfig } from '../config/types.js'

import { defineCLICommand } from './defineCLICommand.js'
import { createProgram } from './index.js'
import { strictObject } from './zod.js'

const cliDirectory = path.dirname(fileURLToPath(import.meta.url))
const testConfigDirectory = path.resolve(cliDirectory, '../../../../test/config')

const createConfig = ({ cli }: { cli?: Config['cli'] } = {}): SanitizedConfig =>
  ({
    cli,
    paths: {
      configDir: cliDirectory,
    },
  }) as SanitizedConfig

const createArgs = ({
  config,
  configDir = cliDirectory,
}: {
  config: SanitizedConfig
  configDir?: string
}): CLIArgs => ({
  configDir,
  getConfig: async () => config,
  getPayload: async () => {
    throw new Error('Payload should not be initialized by these tests.')
  },
  run: async ({ handler }) => {
    await handler()
  },
})

const replacementCommand = defineCLICommand({
  description: 'Replacement command.',
  handler: () => undefined,
  input: strictObject({}),
})

describe('createProgram', () => {
  it('should register built-in commands by their map key', async () => {
    const program = await createProgram(createArgs({ config: createConfig() }))

    expect(program.commands.map((command) => command.name())).toContain('generate:types')
  })

  it('should replace a built-in command with a direct command definition', async () => {
    const program = await createProgram(
      createArgs({
        config: createConfig({
          cli: {
            commands: {
              info: replacementCommand,
            },
          },
        }),
      }),
    )

    expect(program.commands.find((command) => command.name() === 'info')?.description()).toBe(
      'Replacement command.',
    )
  })

  it('should disable an individual command with false', async () => {
    const program = await createProgram(
      createArgs({
        config: createConfig({
          cli: {
            commands: {
              info: false,
            },
          },
        }),
      }),
    )

    expect(program.commands.some((command) => command.name() === 'info')).toBe(false)
    expect(program.commands.length).toBeGreaterThan(0)
  })

  it('should disable all commands with cli false', async () => {
    const program = await createProgram(createArgs({ config: createConfig({ cli: false }) }))

    expect(program.commands).toHaveLength(0)
  })

  it('should load a named command export from a path', async () => {
    const program = await createProgram(
      createArgs({
        config: createConfig({
          cli: {
            commands: {
              environment: './commands/info.js#createInfoCommand',
            },
          },
        }),
      }),
    )

    expect(
      program.commands.find((command) => command.name() === 'environment')?.description(),
    ).toBe('Print environment and dependency information.')
  })

  it('should load a named command export from an object reference', async () => {
    const program = await createProgram(
      createArgs({
        config: createConfig({
          cli: {
            commands: {
              environment: {
                exportName: 'createInfoCommand',
                path: './commands/info.js',
              },
            },
          },
        }),
      }),
    )

    expect(program.commands.some((command) => command.name() === 'environment')).toBe(true)
  })

  it('should load a default command export from a path', async () => {
    const program = await createProgram(
      createArgs({
        config: createConfig({
          cli: {
            commands: {
              'start-server': './customScript.js',
            },
          },
        }),
        configDir: testConfigDirectory,
      }),
    )

    expect(program.commands.some((command) => command.name() === 'start-server')).toBe(true)
  })

  it('should report a missing command export', async () => {
    await expect(
      createProgram(
        createArgs({
          config: createConfig({
            cli: {
              commands: {
                missing: './commands/info.js#missingCommand',
              },
            },
          }),
        }),
      ),
    ).rejects.toThrow(/CLI command 'missing'.*does not export 'missingCommand'/)
  })

  it('should reject an export that is not a CLI command', async () => {
    await expect(
      createProgram(
        createArgs({
          config: createConfig({
            cli: {
              commands: {
                invalid:
                  './generateImportMap/utilities/parsePayloadComponent.js#parsePayloadComponent',
              },
            },
          }),
        }),
      ),
    ).rejects.toThrow(/CLI command 'invalid'.*was not created with defineCLICommand/)
  })

  it('should reject command name and alias conflicts', async () => {
    const conflictingCommand = defineCLICommand({
      aliases: ['info'],
      description: 'Conflicting command.',
      handler: () => undefined,
      input: strictObject({}),
    })

    await expect(
      createProgram(
        createArgs({
          config: createConfig({
            cli: {
              commands: {
                custom: conflictingCommand,
              },
            },
          }),
        }),
      ),
    ).rejects.toThrow("CLI command 'custom' conflicts with 'info'")
  })
})
