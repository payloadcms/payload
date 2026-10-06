/** Framework navigation and access-control signals must reach the route boundary. */
export function isControlFlowError({ error }: { error: unknown }): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if ('digest' in error && typeof error.digest === 'string') {
    if (
      error.digest.startsWith('NEXT_REDIRECT;') ||
      /^NEXT_HTTP_ERROR_FALLBACK;(?:401|403|404)$/.test(error.digest)
    ) {
      return true
    }
  }

  // TanStack Router signals, and the errors used by Payload's page server adapter.
  return (
    ('isRedirect' in error && error.isRedirect === true) ||
    ('isNotFound' in error && error.isNotFound === true) ||
    ('message' in error &&
      typeof error.message === 'string' &&
      (error.message === 'not-found' || error.message.startsWith('redirect:')))
  )
}
