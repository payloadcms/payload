export type CLIExitCodeHandler = (error: unknown) => number | undefined

const handlers = new Set<CLIExitCodeHandler>()

/**
 * Register a classifier before loading config that may throw custom errors.
 * The first handler returning an integer from 1 through 255 chooses the CLI's
 * failure exit code. Return undefined for errors the handler does not recognize.
 * The returned function removes the handler.
 */
export const registerCLIExitCodeHandler = ({
  handler,
}: {
  handler: CLIExitCodeHandler
}): (() => void) => {
  handlers.add(handler)

  return () => {
    handlers.delete(handler)
  }
}

export const getCLIErrorExitCode = ({ error }: { error: unknown }): number => {
  for (const handler of handlers) {
    const exitCode = handler(error)

    if (exitCode !== undefined && Number.isInteger(exitCode) && exitCode >= 1 && exitCode <= 255) {
      return exitCode
    }
  }

  return 1
}
