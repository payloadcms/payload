import { getPlatformProxy } from 'wrangler'

import type { RuntimeCloudflareEnv } from './cloudflare'

const proxy = await getPlatformProxy<RuntimeCloudflareEnv>({
  environment: process.env.CLOUDFLARE_ENV,
  remoteBindings: process.env.PAYLOAD_MIGRATE_REMOTE === 'true',
})

export const cloudflareEnv = proxy.env
