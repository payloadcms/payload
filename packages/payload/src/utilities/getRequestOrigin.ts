import type { CORSConfig, SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

const getTrustedOrigins = (config: Pick<SanitizedConfig, 'cors' | 'csrf'>): null | string[] => {
  const origins = new Set<string>()

  const { cors, csrf } = config

  if (cors === '*') {
    return null
  }

  if (Array.isArray(cors)) {
    cors.forEach((o) => origins.add(o))
  } else if (cors && typeof cors === 'object') {
    const corsOrigins = (cors as CORSConfig).origins
    if (corsOrigins === '*') {
      return null
    }
    if (Array.isArray(corsOrigins)) {
      corsOrigins.forEach((o) => origins.add(o))
    }
  }

  if (Array.isArray(csrf)) {
    csrf.forEach((o) => origins.add(o))
  }

  return [...origins]
}

/**
 * Returns a trusted request origin
 */
export const getRequestOrigin = ({
  config,
  req,
}: {
  config: Pick<SanitizedConfig, 'cors' | 'csrf' | 'serverURL'>
  req: Pick<PayloadRequest, 'headers' | 'payload' | 'url'>
}): string => {
  if (config.serverURL !== null && config.serverURL !== '') {
    return config.serverURL
  }

  let origin = ''
  try {
    const protocol = new URL(req.url!).protocol
    const host = req.headers?.get('host')
    if (host) {
      origin = `${protocol}//${host}`
    }
  } catch {
    // req.url is malformed; origin stays empty
  }

  const trustedOrigins = getTrustedOrigins(config)

  if (trustedOrigins !== null && origin && trustedOrigins.includes(origin)) {
    // Host header value is explicitly listed in the CORS/CSRF allowlist — safe to use.
    return origin
  }

  req.payload.logger.warn(
    `Request origin "${origin}" is not in the CORS/CSRF allowlist. Falling back to empty string as request origin. It is recommended to explicitly set the serverURL in the config to avoid this warning and ensure correct request origin is used.`,
  )

  return ''
}
