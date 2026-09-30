import type { ConfigOptions } from 'cloudinary'

import type { ResolvedCloudinaryConfig } from './types.js'

/**
 * Builds the config merged into every Cloudinary call from either explicit options or a
 * `cloudinary://<api_key>:<api_secret>@<cloud_name>` URL (`CLOUDINARY_URL` by default).
 */
export function resolveConfig({
  config,
  url,
}: {
  config?: ConfigOptions
  url?: string
}): ResolvedCloudinaryConfig {
  const resolved: ConfigOptions = {
    secure: true,
    ...parseCloudinaryURL(url ?? process.env.CLOUDINARY_URL),
    ...config,
  }

  const missing = (['api_key', 'api_secret', 'cloud_name'] as const).filter((key) => !resolved[key])

  if (missing.length) {
    throw new Error(
      `cloudinaryTransformer is missing required credentials: ${missing.join(', ')}. Pass them via the \`config\` option, the \`url\` option, or the CLOUDINARY_URL environment variable.`,
    )
  }

  return resolved as ResolvedCloudinaryConfig
}

function parseCloudinaryURL(url: string | undefined): ConfigOptions {
  if (!url) {
    return {}
  }

  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      'Invalid Cloudinary URL. Expected the format `cloudinary://<api_key>:<api_secret>@<cloud_name>`.',
    )
  }

  if (parsed.protocol !== 'cloudinary:') {
    throw new Error(
      `Invalid Cloudinary URL protocol "${parsed.protocol}". Expected the format \`cloudinary://<api_key>:<api_secret>@<cloud_name>\`.`,
    )
  }

  return {
    api_key: decodeURIComponent(parsed.username) || undefined,
    api_secret: decodeURIComponent(parsed.password) || undefined,
    cloud_name: parsed.hostname || undefined,
  }
}
