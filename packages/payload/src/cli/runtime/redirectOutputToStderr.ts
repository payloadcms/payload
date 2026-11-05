import { Console } from 'node:console'

const originalStdoutWrite = process.stdout.write.bind(process.stdout)

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

/** Writes the final CLI response to stdout even while diagnostic output is being redirected. */
export const writeToCLIStdout = ({
  output,
  write,
}: {
  output: string
  write?: (output: string) => void
}): void => {
  if (!write) {
    originalStdoutWrite(output)
    return
  }

  const redirectedStdoutWrite = process.stdout.write.bind(process.stdout)

  process.stdout.write = originalStdoutWrite

  try {
    write(output)
  } finally {
    process.stdout.write = redirectedStdoutWrite
  }
}
