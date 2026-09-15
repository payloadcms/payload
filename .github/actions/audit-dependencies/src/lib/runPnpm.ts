import { execFile } from 'node:child_process'

export type PnpmResult = {
  code: number
  stdout: string
  stderr: string
}

/** Injectable seam so audit orchestration can be tested without spawning pnpm. */
export type RunPnpm = (input: { args: string[]; cwd: string }) => Promise<PnpmResult>

/**
 * Runs pnpm and always resolves — a non-zero exit is normal for `pnpm audit`
 * (it exits 1 when vulnerabilities are found), so callers inspect stdout/code
 * rather than relying on a throw.
 */
export const runPnpm: RunPnpm = ({ args, cwd }) =>
  new Promise((resolve) => {
    execFile(
      'pnpm',
      args,
      {
        cwd,
        env: { ...process.env, DO_NOT_TRACK: '1', NEXT_TELEMETRY_DISABLED: '1' },
        maxBuffer: 64 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        resolve({
          code: exitCodeOf(error),
          stderr: stderr.toString(),
          stdout: stdout.toString(),
        })
      },
    )
  })

const exitCodeOf = (error: unknown): number => {
  if (error === null) {
    return 0
  }
  if (isRecord(error) && typeof error.code === 'number') {
    return error.code
  }
  return 1
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
