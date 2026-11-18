import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as z from 'zod/mini'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CLIRuntime, Config, SanitizedConfig } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { defineCLICommand } from './defineCLICommand.js'
import { createCLI } from './index.js'
import { normalizeHelpArguments } from './program/normalizeHelpArguments.js'
import { CLICommandError, getCLIErrorOutput } from './runtime/output.js'
import { strictObject } from '../utilities/zod.js'

const cliDirectory = path.dirname(fileURLToPath(import.meta.url))

describe('CLI exit codes', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await mkdtemp(path.join(tmpdir(), 'payload-cli-exit-'))

    const runCommandURL = pathToFileURL(
      path.resolve(cliDirectory, '../../dist/cli/commands/run.js'),
    ).href

    await writeFile(
      path.join(testDir, 'payload.config.mjs'),
      `import { createRunCommand } from ${JSON.stringify(runCommandURL)}
export default { cli: { commands: { run: createRunCommand } } }
`,
    )
  })

  afterEach(async () => {
    await rm(testDir, { force: true, recursive: true })
  })

  it.each([
    { exitCode: 0, source: 'await Promise.resolve()', state: 'completes' },
    { exitCode: 13, source: 'await new Promise(() => {})', state: 'remains pending' },
    { exitCode: 1, source: "throw new Error('EXPECTED_FAILURE')", state: 'throws' },
    { exitCode: 7, source: 'process.exitCode = 7', state: 'sets a custom exit code' },
  ])('should exit with code $exitCode when the script $state', async ({ exitCode, source }) => {
    const scriptPath = path.join(testDir, 'script.mjs')

    await writeFile(scriptPath, `console.log('SCRIPT_STARTED')\n${source}\n`)

    const result = spawnSync(
      process.execPath,
      [path.resolve(cliDirectory, '../../bin.js'), 'run', scriptPath],
      {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, PAYLOAD_CONFIG_PATH: path.join(testDir, 'payload.config.mjs') },
        timeout: 10_000,
      },
    )

    expect(result.error).toBeUndefined()
    expect(result.signal).toBeNull()
    expect(result.stdout).toContain('SCRIPT_STARTED')
    expect(result.status).toBe(exitCode)
  })
})

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
  it('should not treat forwarded help arguments as Payload help', async () => {
    const cli = await createCLI(createRuntime({ config: createConfig() }))
    const args = ['node', 'payload', 'build', '--no-types', '--', '--help']

    expect(normalizeHelpArguments({ args, cli })).toEqual(args)
  })

  it('should add built-in command references from one module to the sanitized config', () => {
    const config = createConfig()

    expect(config.cli && config.cli.commands).toMatchObject({
      build: 'payload/cli/builtin#createBuildCommand',
      createDocuments: 'payload/cli/builtin#createCreateDocumentsCommand',
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

  it.each([
    ['before', ['--json', 'result']],
    ['after', ['result', '--json']],
  ])('should accept the global JSON option %s the command', async (_, argv) => {
    const resultCommand = defineCLICommand({
      description: 'Return a result.',
      handler: () => ({ result: { value: 42 } }),
      input: strictObject({}),
    })
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              result: resultCommand,
            },
          },
        }),
      }),
    )
    const command = cli.commands.find((item) => item.name() === 'result')!
    let output = ''

    command.configureOutput({ writeOut: (value) => (output += value) })
    await cli.parseAsync(argv, { from: 'user' })

    expect(JSON.parse(output)).toEqual({
      command: 'result',
      result: { value: 42 },
      success: true,
    })
  })

  it('should use JSON output when PAYLOAD_CLI_JSON is set', async () => {
    const resultCommand = defineCLICommand({
      description: 'Return a result.',
      handler: () => ({ result: { value: 42 } }),
      input: strictObject({}),
    })
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              result: resultCommand,
            },
          },
        }),
      }),
    )
    const command = cli.commands.find((item) => item.name() === 'result')!
    const previousValue = process.env.PAYLOAD_CLI_JSON
    let output = ''

    command.configureOutput({ writeOut: (value) => (output += value) })
    process.env.PAYLOAD_CLI_JSON = '1'

    try {
      await cli.parseAsync(['result'], { from: 'user' })
    } finally {
      if (previousValue === undefined) {
        delete process.env.PAYLOAD_CLI_JSON
      } else {
        process.env.PAYLOAD_CLI_JSON = previousValue
      }
    }

    expect(JSON.parse(output)).toEqual({
      command: 'result',
      result: { value: 42 },
      success: true,
    })
  })

  it('should send logs to stderr in JSON mode', async () => {
    const previousConsole = globalThis.console
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const resultCommand = defineCLICommand({
      description: 'Log and return a result.',
      handler: () => {
        globalThis.console.log('Created document 42')
        globalThis.console.warn('This is a warning')
        process.stdout.write('Direct stdout write')

        return { result: { value: 42 } }
      },
      input: strictObject({}),
    })
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              result: resultCommand,
            },
          },
        }),
      }),
    )
    const command = cli.commands.find((item) => item.name() === 'result')!
    let output = ''

    command.configureOutput({ writeOut: (value) => (output += value) })
    await cli.parseAsync(['result', '--json'], { from: 'user' })

    expect(globalThis.console).toBe(previousConsole)
    expect(JSON.parse(output)).toEqual({
      command: 'result',
      result: { value: 42 },
      success: true,
    })
    expect(stderrWrite.mock.calls.map(([value]) => String(value)).join('')).toContain(
      'Created document 42',
    )
    expect(stderrWrite.mock.calls.map(([value]) => String(value)).join('')).toContain(
      'This is a warning',
    )
    expect(stderrWrite.mock.calls.map(([value]) => String(value)).join('')).toContain(
      'Direct stdout write',
    )
  })

  it('should send logs to stderr when a JSON command fails', async () => {
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const failingCommand = defineCLICommand({
      description: 'Log and fail.',
      handler: () => {
        globalThis.console.error('Migration failed')
        throw new Error('No connection')
      },
      input: strictObject({}),
    })
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              failing: failingCommand,
            },
          },
        }),
      }),
    )

    let thrownError: unknown

    try {
      await cli.parseAsync(['failing', '--json'], { from: 'user' })
    } catch (error) {
      thrownError = error
    }

    expect(getCLIErrorOutput({ error: thrownError })).toEqual({
      command: 'failing',
      error: {
        code: 'COMMAND_FAILED',
        message: 'No connection',
      },
      success: false,
    })
    expect(stderrWrite.mock.calls.map(([value]) => String(value)).join('')).toContain(
      'Migration failed',
    )
  })

  it('should include validation issues and the input schema in JSON errors', async () => {
    const validatedCommand = defineCLICommand({
      description: 'Validate input.',
      handler: () => undefined,
      input: strictObject({
        count: z.int(),
      }),
    })
    const cli = await createCLI(
      createRuntime({
        config: createConfig({
          cli: {
            commands: {
              validate: validatedCommand,
            },
          },
        }),
      }),
    )

    let thrownError: unknown

    try {
      await cli.parseAsync(['validate', '--count', 'nope', '--json'], { from: 'user' })
    } catch (error) {
      thrownError = error
    }

    expect(thrownError).toBeInstanceOf(CLICommandError)
    expect(getCLIErrorOutput({ error: thrownError })).toMatchObject({
      command: 'validate',
      error: {
        code: 'INVALID_INPUT',
        inputSchema: {
          properties: {
            count: { type: 'integer' },
          },
        },
        issues: [{ path: 'count' }],
      },
      success: false,
    })
  })
})
