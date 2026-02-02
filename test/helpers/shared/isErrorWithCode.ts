export function isErrorWithCode(err: unknown, code?: string): err is NodeJS.ErrnoException {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as any).code === 'string' &&
    (!code || (err as NodeJS.ErrnoException).code === code)
  )
}
