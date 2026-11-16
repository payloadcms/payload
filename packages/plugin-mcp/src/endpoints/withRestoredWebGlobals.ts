/**
 * Restores globals replaced by @hono/node-server while handling an MCP request.
 */
export const withRestoredWebGlobals = async <T>(handler: () => Promise<T>): Promise<T> => {
  const globals = globalThis as Record<string, unknown>
  const originalRequest = globals['Request']
  const originalResponse = globals['Response']

  try {
    return await handler()
  } finally {
    if (globals['Response'] !== originalResponse) {
      Object.defineProperty(globalThis, 'Response', { value: originalResponse })
    }
    if (globals['Request'] !== originalRequest) {
      Object.defineProperty(globalThis, 'Request', { value: originalRequest })
    }
  }
}
