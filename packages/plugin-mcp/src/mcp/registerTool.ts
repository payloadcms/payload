export const registerTool = (
  isEnabled: boolean | undefined,
  toolType: string,
  registrationFn: () => void,
  payload: { logger: { info: (message: string) => void } },
  useVerboseLogs: boolean,
) => {
  if (isEnabled) {
    registrationFn()
    if (useVerboseLogs) {
      payload.logger.info(`[payload-mcp] ✅ Tool: ${toolType} Registered.`)
    }
  } else if (useVerboseLogs) {
    payload.logger.info(`[payload-mcp] ⏭️ Tool: ${toolType} Skipped.`)
  }
}
