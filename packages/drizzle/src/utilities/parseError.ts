/**
 * Format error message with hint if available
 */
export const parseError = (err: unknown, msg: string): string => {
  let formattedMsg = `${msg}`
  if (err instanceof Error) {
    formattedMsg += ` ${err.message}.`
    // Check if the error has a hint property
    if ('hint' in err && typeof err.hint === 'string') {
      formattedMsg += ` ${err.hint}.`
    }
  }
  return formattedMsg
}
