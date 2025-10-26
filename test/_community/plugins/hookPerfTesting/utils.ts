import type { BasePayload, CollectionBeforeChangeHook, PayloadRequest } from 'payload'

/**
 * Wraps a hook with timing logic
 * @param hookName - Name of the hook (e.g., 'beforeChange', 'afterRead')
 * @param hookFn - Original hook function to wrap
 * @param collectionSlug - Collection slug for logging context
 * @param hookIndex - Index of hook in array (for multiple hooks of same type)
 */
export function wrapHookWithTimer<T extends (...args: any[]) => any>(
  hookName: string,
  hookFn: T,
  collectionSlug: string,
  hookIndex: number,
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now()

    // Extract req from hook args (first arg is typically the hook args object with req)
    const hookArgs = args[0]
    const logger = hookArgs?.req?.payload?.logger as BasePayload['logger']

    try {
      const result = await hookFn(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      logHookTiming({
        collectionSlug,
        duration,
        hookIndex,
        hookName,
        logger,
        success: true,
      })

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logHookTiming({
        collectionSlug,
        duration,
        error: error instanceof Error ? error.message : String(error),
        hookIndex,
        hookName,
        logger,
        success: false,
      })

      throw error
    }
  }) as T
}

type HookTimingLog = {
  collectionSlug: string
  duration: number
  error?: string
  hookIndex: number
  hookName: string
  logger?: BasePayload['logger']
  success: boolean
}

/**
 * Logs hook timing information
 */
function logHookTiming(log: HookTimingLog): void {
  const status = log.success ? '✓' : '✗'
  const errorMsg = log.error ? ` - Error: ${log.error}` : ''
  const message = `[Hook Perf] ${status} ${log.collectionSlug}.${log.hookName}[${log.hookIndex}]: ${Math.round(log.duration)}ms${errorMsg}`

  if (log.logger?.debug) {
    log.logger.info(message)
  } else {
    // Fallback to console if logger not available
    console.log(message)
  }
}

/**
 * Wraps an array of hooks with timing logic
 */
export function wrapHooksArray<T extends (...args: any[]) => any>(
  hookName: string,
  hooks: T[] | undefined,
  collectionSlug: string,
): T[] {
  if (!hooks || hooks.length === 0) {
    return []
  }

  return hooks.map((hook, index) => wrapHookWithTimer(hookName, hook, collectionSlug, index))
}
