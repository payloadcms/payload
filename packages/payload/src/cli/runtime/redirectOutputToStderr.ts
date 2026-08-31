import { Console } from 'node:console'

/** Sends console calls and direct stdout writes to stderr until the returned function is called. */
export const redirectOutputToStderr = (): (() => void) => {
  const previousConsole = globalThis.console
  const previousStdoutWrite = process.stdout.write.bind(process.stdout)

  globalThis.console = new Console({
    colorMode: false,
    stderr: process.stderr,
    stdout: process.stderr,
  })
  process.stdout.write = process.stderr.write.bind(process.stderr)

  return () => {
    globalThis.console = previousConsole
    process.stdout.write = previousStdoutWrite
  }
}
