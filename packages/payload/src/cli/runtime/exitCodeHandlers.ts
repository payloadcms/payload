export type CLIExitCodeHandler = (error: unknown) => number | undefined

const handlers = new Set<{ handler: CLIExitCodeHandler }>()

/**
 * Register a classifier before loading config that may throw custom errors.
 * The first handler returning an integer from 1 through 255 chooses the CLI's
 * failure exit code. Return undefined for errors the handler does not recognize.
 * Handlers that throw are ignored. The returned function removes this registration.
 */
export const registerCLIExitCodeHandler = ({
  handler,
}: {
  handler: CLIExitCodeHandler
}): (() => void) => {
  const registration = { handler }

  handlers.add(registration)

  return () => {
    handlers.delete(registration)
  }
}

export const getCLIErrorExitCode = ({ error }: { error: unknown }): number => {
  for (const { handler } of handlers) {
    try {
      const exitCode = handler(error)

      if (
        exitCode !== undefined &&
        Number.isInteger(exitCode) &&
        exitCode >= 1 &&
        exitCode <= 255
      ) {
        return exitCode
      }
    } catch {
      // A classifier must not prevent reporting the original CLI error.
    }
  }

  return 1
}
