/**
 * Strategy for dev-mode HMR/reload detection.
 * Each framework adapter provides its own implementation.
 */
export type DevReloadStrategy = {
  connect: (onReload: () => void) => DevReloadCleanup
}

export type DevReloadCleanup = () => void

/**
 * A global, not a module variable: bundlers give the app's server graph its own
 * copy of `payload`, so the registrar and `getPayload` are often different
 * module instances. Adapters that can't import this module may set the key
 * directly — keep the literal in sync.
 */
export const DEV_RELOAD_STRATEGY_GLOBAL_KEY = '_payload_devReloadStrategy'

/**
 * Registers the strategy `getPayload` uses to learn the config changed on disk.
 * Covers callers that never see `InitOptions`, such as `handleEndpoints`.
 * Pass `null` to unregister.
 */
export const registerDevReloadStrategy = (strategy: DevReloadStrategy | null): void => {
  ;(globalThis as unknown as Record<string, unknown>)[DEV_RELOAD_STRATEGY_GLOBAL_KEY] = strategy
}

/** The strategy set by {@link registerDevReloadStrategy}, or `null` if none is registered. */
export const getRegisteredDevReloadStrategy = (): DevReloadStrategy | null =>
  ((globalThis as unknown as Record<string, unknown>)[DEV_RELOAD_STRATEGY_GLOBAL_KEY] as
    | DevReloadStrategy
    | undefined) ?? null
