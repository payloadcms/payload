/**
 * Automatically accepts any prompts triggered during the execution of `callPrompt`.
 * WARNING: May not work for all types of prompts.
 * @experimental
 */
export const acceptDrizzlePrompts = async <T>(
  callPrompt: () => Promise<T> | T,
  {
    silenceLogs = false,
  }: {
    silenceLogs?: boolean
  } = {},
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const write = process.stdout.write

  if (silenceLogs) {
    process.stdout.write = () => true
  }

  const promise = callPrompt()

  const interval = setInterval(
    () =>
      process.stdin.emit('keypress', '\n', {
        name: 'return',
        ctrl: false,
      }),
    25,
  )

  const res = await promise

  if (silenceLogs) {
    process.stdout.write = write
  }

  clearInterval(interval)

  return res
}
