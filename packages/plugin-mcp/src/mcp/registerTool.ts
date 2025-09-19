export const registerTool = (
  isEnabled: boolean | undefined,
  toolType: string,
  registrationFn: () => void,
  payload: { logger: { info: (message: string) => void } },
  useVerboseLogs: boolean,
) => {
  if (isEnabled) {
    try {
      registrationFn()
      if (useVerboseLogs) {
        payload.logger.info(`[payload-mcp] ✅ Tool: ${toolType} Registered.`)
      }
    } catch (error) {
      // Log the error and re-throw
      payload.logger.info(`[payload-mcp] ❌ Tool: ${toolType} Failed to register.`)
      throw error
    }
  } else if (useVerboseLogs) {
    payload.logger.info(`[payload-mcp] ⏭️ Tool: ${toolType} Skipped.`)
  }
}
