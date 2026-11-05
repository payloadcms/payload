import type { StripeRESTAccess, StripeRESTConfig } from '../types.js'

const migrationError =
  'The Stripe REST endpoint now requires an object with a non-empty allowedMethods array of exact method names.'

export const sanitizeStripeRESTConfig = ({
  rest,
}: {
  rest: unknown
}): StripeRESTConfig | undefined => {
  if (rest === undefined || rest === false) {
    return undefined
  }

  if (
    typeof rest !== 'object' ||
    rest === null ||
    Array.isArray(rest) ||
    !('allowedMethods' in rest) ||
    !Array.isArray(rest.allowedMethods)
  ) {
    throw new Error(migrationError)
  }

  const access = 'access' in rest ? rest.access : undefined

  if (
    rest.allowedMethods.length === 0 ||
    rest.allowedMethods.some(
      (method) => typeof method !== 'string' || method.trim().length === 0 || method.includes('*'),
    ) ||
    (access !== undefined && !isStripeRESTAccess(access))
  ) {
    throw new Error(migrationError)
  }

  const allowedMethods = Object.freeze([...new Set(rest.allowedMethods)])

  return access === undefined ? { allowedMethods } : { access, allowedMethods }
}

const isStripeRESTAccess = (access: unknown): access is StripeRESTAccess =>
  typeof access === 'function'
