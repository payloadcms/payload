/**
 * Strategy for dev-mode HMR/reload detection.
 * Each framework adapter provides its own implementation.
 */
export type DevReloadStrategy = {
  connect: (onReload: () => void) => DevReloadCleanup
}

export type DevReloadCleanup = () => void

let registeredStrategy: DevReloadStrategy | null = null

/**
 * Registers the strategy `getPayload` uses to learn the config changed on disk.
 * Covers callers that never see `InitOptions`, such as `handleEndpoints`.
 * Pass `null` to unregister.
 *
 * Scoped to this module instance rather than `globalThis`, so the registrar has
 * to run in the same module graph as the `getPayload` calls it should affect.
 * Framework adapters register from their server runtime, which resolves the
 * same copy of `payload` as the app.
 *
 * @internal
 */
export const registerDevReloadStrategy = (strategy: DevReloadStrategy | null): void => {
  registeredStrategy = strategy
}

/**
 * The strategy set by {@link registerDevReloadStrategy}, or `null` if none is registered.
 *
 * @internal
 */
export const getRegisteredDevReloadStrategy = (): DevReloadStrategy | null => registeredStrategy
