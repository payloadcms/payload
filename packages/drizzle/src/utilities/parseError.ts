import pg from 'pg'
const { DatabaseError } = pg

/**
 * Format error message with hint if available
 */
export const parseError = (err: unknown, msg: string): string => {
  let formattedMsg = `${msg}`
  if (err instanceof Error) {
    formattedMsg += ` ${err.message}.`
    if (err instanceof DatabaseError) {
      msg += `: ${err.message}`
      if (err.hint) msg += ` ${err.hint}.`
    }
  }
  return formattedMsg
}
