import { CommanderError } from 'commander'

export const handleCLIError = ({ error }: { error: unknown }): void => {
  const exitCode = error instanceof CommanderError ? error.exitCode : 1

  if (!(error instanceof CommanderError)) {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error)
  }

  process.exitCode = exitCode
}

/** Wraps the CLI entry point so every failure exits cleanly. */
export const withErrorHandling =
  (run: () => Promise<void>): (() => Promise<void>) =>
  async () => {
    try {
      await run()
    } catch (error) {
      handleCLIError({ error })
      process.exit(process.exitCode ?? 1)
    }
  }
