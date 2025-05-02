import type { ScopeContext } from '@sentry/types'
import type { AfterErrorHookArgs } from 'payload'

type SentryInstance = {
  captureException: (err: Error, hint: any) => string
}

type ContextArgs = {
  defaultContext: Partial<ScopeContext>
} & AfterErrorHookArgs

export interface PluginOptions {
  /**
   * Enable or disable Sentry plugin
   * @default true
   */
  enabled?: boolean
  /**
   * Options passed directly to Sentry
   */
  options?: {
    /**
     * Sentry will only capture 500 errors by default.
     * If you want to capture other errors, you can add them as an array here.
     * @default []
     */
    captureErrors?: number[]
    /**
     * Set `ScopeContext` for `Sentry.captureException` which includes `user` and other info.
     */
    context?: (args: ContextArgs) => Partial<ScopeContext> | Promise<Partial<ScopeContext>>
    /**
     * Log captured exceptions,
     * @default false
     */
    debug?: boolean
  }
  /**
   * Instance of Sentry from
   * ```ts
   * import * as Sentry from '@sentry/nextjs'
   * ```
   * This is required unless enabled is set to false.
   */
  Sentry?: SentryInstance
}
