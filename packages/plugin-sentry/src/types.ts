import type { ClientOptions } from '@sentry/types'

export interface PluginOptions {
  dsn: string
  options?: ClientOptions
}
