import type { PayloadRequest } from 'payload'

export type DebugLog = (args: { msg: string; req: PayloadRequest }) => void

/**
 * Builds the logger for `cloudinaryTransformer({ debug: true })`, which reports every
 * call made to Cloudinary. Logged at `info` so it shows up under Payload's default
 * log level; a no-op when debugging is off.
 */
export function createDebugLog({
  slug,
  isEnabled,
}: {
  isEnabled: boolean
  slug: string
}): DebugLog {
  if (!isEnabled) {
    return () => {}
  }

  return ({ msg, req }) => {
    req.payload?.logger.info({ msg: `[${slug}] ${msg}` })
  }
}

export function formatElapsed(startedAt: number): string {
  return `${Date.now() - startedAt}ms`
}
