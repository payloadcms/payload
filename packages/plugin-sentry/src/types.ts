import type { RequestHandlerOptions } from '@sentry/node/types/handlers'
import type { ClientOptions } from '@sentry/types'

export interface PluginOptions {
  dsn: string | null
  enabled?: boolean
  options?: {
    init?: Partial<ClientOptions>
    requestHandler?: RequestHandlerOptions
    captureErrors?: number[]
  }
}
