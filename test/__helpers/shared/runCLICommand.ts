import execa from 'execa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgsStringToArgv } from 'string-argv'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const runnerPath = path.resolve(dirname, 'runPayloadCLI.ts')

type CLIInput =
  | {
      command: string
      reject?: boolean
    }
  | string

/** Runs the real Payload CLI in an isolated process against a test project. */
export const runCLICommand = async (
  input: CLIInput,
  { configPath, cwd = process.cwd() }: { configPath: string; cwd?: string },
): Promise<{ exitCode: number; stderr: string; stdout: string }> => {
  const command = typeof input === 'string' ? input : input.command
  const reject = typeof input === 'string' ? true : input.reject

  const { exitCode, stderr, stdout } = await execa(
    process.execPath,
    ['--import', 'tsx', runnerPath, ...parseArgsStringToArgv(command)],
    {
      cwd,
      env: {
        ...process.env,
        PAYLOAD_CONFIG_PATH: configPath,
      },
      reject,
    },
  )

  return { exitCode, stderr, stdout }
}
