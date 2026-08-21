import execa from 'execa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgsStringToArgv } from 'string-argv'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const runnerPath = path.resolve(dirname, 'runPayloadCLI.ts')

type CLIInput =
  | {
      command: string
      configPath?: string
    }
  | string

/** Runs the real Payload CLI in an isolated process against a test project. */
export const runCLICommand = async (
  input: CLIInput,
  { cwd = process.cwd() }: { cwd?: string } = {},
): Promise<{ stderr: string; stdout: string }> => {
  const command = typeof input === 'string' ? input : input.command
  const configPath = typeof input === 'string' ? undefined : input.configPath

  const { stderr, stdout } = await execa(
    process.execPath,
    ['--import', 'tsx', runnerPath, ...parseArgsStringToArgv(command)],
    {
      cwd,
      env: {
        ...process.env,
        ...(configPath ? { PAYLOAD_CONFIG_PATH: configPath } : {}),
      },
    },
  )

  return { stderr, stdout }
}
