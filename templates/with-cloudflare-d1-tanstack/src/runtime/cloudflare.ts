import { env } from 'cloudflare:workers'

export type RuntimeCloudflareEnv = CloudflareEnv & {
  PAYLOAD_SECRET?: string
}

export const cloudflareEnv = env as RuntimeCloudflareEnv
