import type { PayloadRequest } from 'payload'

/**
 * Encrypts data for the client to hold, so it doesn't need to be stored. `type` keeps one kind
 * from being used as another, e.g. a client ID as an authorization code.
 */
export const seal = ({
  type,
  data,
  expiresIn,
  req,
}: {
  data: object
  /** Seconds */
  expiresIn?: number
  req: PayloadRequest
  type: string
}): string =>
  req.payload.encrypt(
    JSON.stringify({ ...data, type, exp: expiresIn && Date.now() + expiresIn * 1000 }),
  )

export const unseal = <T>({
  type,
  req,
  value,
}: {
  req: PayloadRequest
  type: string
  value: null | string
}): T | undefined => {
  // Only the v1 format is authenticated. Older formats decrypt anything without an error.
  if (!value?.startsWith('v1:')) {
    return undefined
  }

  try {
    const data = JSON.parse(req.payload.decrypt(value, { secret: req.payload.config.secret }))
    return data.type === type && (!data.exp || data.exp > Date.now()) ? data : undefined
  } catch {
    return undefined
  }
}
