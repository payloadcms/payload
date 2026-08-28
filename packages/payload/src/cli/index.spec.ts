import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CLIRuntime, Config, SanitizedConfig } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { defineCLICommand } from './defineCLICommand.js'
import { createCLI } from './index.js'
import { strictObject } from './zod.js'

const cliDirectory = path.dirname(fileURLToPath(import.meta.url))

afterEach(() => {
  vi.restoreAllMocks()
})

const createConfig = ({ cli }: { cli?: Config['cli'] } = {}): SanitizedConfig => {
  return sanitizeConfig({
    cli,
    db: {
      defaultIDType: 'text',
      // @ts-expect-error The CLI tests do not connect to a database.
      init: () => undefined,
    },
    secret: 'test',
  })
}

const createRuntime = ({
  config,
  configDir = cliDirectory,
}: {
  config: SanitizedConfig
  configDir?: string
}): CLIRuntime => ({
  configDir,
  destroy: async () => undefined,
  getConfig: async () => config,
  getPayload: async () => {
    throw new Error('Payload should not be initialized by these tests.')
  },
  isScheduled: false,
  markScheduled: () => undefined,
})

const replacementCommand = defineCLICommand({
  description: 'Replacement command.',
  handler: () => undefined,
  input: strictObject({}),
})

describe('createCLI', () => {
  it('should add built-in command references from one module to the sanitized config', () => {
    const config = createConfig()

    expect(config.cli && config.cli.commands).toMatchObject({
      build: 'payload/cli/builtin#createBuildCommand',
      info: 'payload/cli/builtin#createInfoCommand',
    })
  })

  it('should register built-in commands by their map key', async () => {
    const cli = await createCLI(createRuntime({ config: createConfig() }))

    expect(cli.commands.map((command) => command.name())).toContain('generate:types')
  })

  it('should replace a built-in command with a direct command definition', async () => {
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              info: replacementCommand,
            },
          },
        }),
      }),
    )

    expect(cli.commands.find((command) => command.name() === 'info')?.description()).toBe(
      'Replacement command.',
    )
  })

  it('should disable an individual command with false', async () => {
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              info: false,
            },
          },
        }),
      }),
    )

    expect(cli.commands.some((command) => command.name() === 'info')).toBe(false)
    expect(cli.commands.length).toBeGreaterThan(0)
  })

  it('should disable all commands with cli false', async () => {
    const cli = await createCLI(createRuntime({ config: createConfig({ cli: false }) }))

    expect(cli.commands).toHaveLength(0)
  })

  it('should load a named command export from a path', async () => {
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              environment: './commands/info.js#createInfoCommand',
            },
          },
        }),
      }),
    )

    expect(cli.commands.find((command) => command.name() === 'environment')?.description()).toBe(
      'Print environment and dependency information.',
    )
  })

  it('should report a missing command export', async () => {
    await expect(
      createCLI(
        createRuntime({
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
      createCLI(
        createRuntime({
          config: createConfig({
            cli: {
              commands: {
                invalid:
                  './commands/generateImportMap/utilities/parsePayloadComponent.js#parsePayloadComponent',
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
      createCLI(
        createRuntime({
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
