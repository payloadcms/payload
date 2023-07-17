import type { RequestHandlerOptions } from '@sentry/node/types/handlers'
import type { ClientOptions } from '@sentry/types'

export interface PluginOptions {
  /**
   * Sentry DSN (Data Source Name)
   * This is required unless enabled is set to false.
   * Sentry automatically assigns a DSN when you create a project.
   * If you don't have a DSN yet, you can create a new project here: https://sentry.io
   */
  dsn: string | null
  /**
   * Enable or disable Sentry plugin
   * @default false
   */
  enabled?: boolean
  /**
   * Options passed directly to Sentry
   * @default false
   */
  options?: {
    /**
     * Passes any valid options to Sentry.init()
     */
    init?: Partial<ClientOptions>
    /**
     * Passes any valid options to Sentry.Handlers.requestHandler()
     */
    requestHandler?: RequestHandlerOptions
    /**
     * Sentry will only capture 500 errors by default.
     * If you want to capture other errors, you can add them as an array here.
     */
    captureErrors?: number[]
  }
}
