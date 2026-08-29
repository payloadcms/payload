import type { Command } from 'commander'

/**
 * Sends both help syntaxes through Payload's `help` command.
 *
 * For example, `payload info --help --json` becomes
 * `payload help info --json`, so both forms use the same handler and output.
 */
export const normalizeHelpArguments = ({
  args,
  cli,
}: {
  args: string[]
  cli: Command
}): string[] => {
  const userArgs = args.slice(2)

  if (!userArgs.some((argument) => argument === '--help' || argument === '-h')) {
    return args
  }

  const selectedCommand = userArgs
    .map((argument) =>
      cli.commands.find(
        (command) => command.name() === argument || command.aliases().includes(argument),
      ),
    )
    .find((command) => command !== undefined)

  if (selectedCommand?.name() === 'help') {
    return args
  }

  const [executable, script] = args

  if (!executable || !script) {
    return args
  }

  return [
    executable,
    script,
    'help',
    ...(selectedCommand ? [selectedCommand.name()] : []),
    ...(userArgs.includes('--json') ? ['--json'] : []),
  ]
}
