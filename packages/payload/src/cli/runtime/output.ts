import { CommanderError } from 'commander'

/**
 * Wraps the CLI entry point so every failure exits cleanly.
 */
export const withErrorHandling =
  (run: () => Promise<void>): (() => Promise<void>) =>
  async () => {
    try {
      await run()
    } catch (error) {
      const exitCode = error instanceof CommanderError ? error.exitCode : 1

      if (!(error instanceof CommanderError)) {
        // Do not print Commander errors. Commander prints its own errors before throwing a `CommanderError`
        // eslint-disable-next-line no-console
        console.error(error)
      }

      process.exitCode = exitCode

      process.exit(process.exitCode ?? 1)
    }
  }
