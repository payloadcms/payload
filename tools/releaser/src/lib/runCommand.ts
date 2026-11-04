import { spawnSync } from 'child_process'

/**
 * Runs a shell command with stdout streamed live. Stderr is captured, printed, and included in the
 * thrown error, so callers can classify a failure by its text, such as a rejected git push.
 */
export const runCommand = ({ cmd, cwd }: { cmd: string; cwd: string }): void => {
  const result = spawnSync(cmd, {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: ['inherit', 'inherit', 'pipe'],
  })
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd}\n${result.stderr}`)
  }
}
