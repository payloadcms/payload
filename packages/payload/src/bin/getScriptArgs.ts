/**
 * Returns the arguments a `payload run` script should receive, in the order they were typed.
 *
 * Minimist consumes flags into named keys, so `args._` holds positionals only — forwarding it
 * silently drops every flag, and `process.argv.includes('--pre')` inside the script is always
 * `false`. Slicing the raw arguments after the script path forwards flags and positionals alike.
 *
 * For example, `payload run ./seed.ts --pre first` returns `['--pre', 'first']`.
 */
export const getScriptArgs = ({
  argv,
  script,
  scriptPath,
}: {
  /** `process.argv` with the node and bin entries removed. */
  argv: string[]
  /** The bin command being run, such as `run`. */
  script: string
  /** The script path as it was typed on the command line. */
  scriptPath: string
}): string[] => {
  // Look for the script path after the command so an identical earlier value — for example an
  // option value — is not mistaken for it.
  const commandIndex = argv.findIndex((arg) => arg.toLowerCase() === script)
  const scriptPathIndex = argv.indexOf(scriptPath, commandIndex + 1)

  return scriptPathIndex === -1 ? [] : argv.slice(scriptPathIndex + 1)
}
