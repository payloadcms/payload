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
  // Arguments after `--` belong to the program called by the Payload command.
  // For example, `payload build -- --help` must show the framework's help,
  // while `payload build --help` must show Payload's build-command help.
  const separatorPosition = args.indexOf('--', 2)
  const payloadArguments = args.slice(2, separatorPosition === -1 ? args.length : separatorPosition)

  if (!payloadArguments.includes('--help') && !payloadArguments.includes('-h')) {
    return args
  }

  const selectedCommand = payloadArguments
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
    ...(payloadArguments.includes('--json') ? ['--json'] : []),
  ]
}
