export const registerTool = (
  isEnabled: boolean | undefined,
  toolName: string,
  registrationFn: () => void,
  payload: { logger: { info: (message: string) => void } },
  useVerboseLogs: boolean,
) => {
  if (isEnabled) {
    registrationFn()
    if (useVerboseLogs) {
      payload.logger.info(`[payload-mcp] ✅ ${toolName} Tool Registered.`)
    }
  } else if (useVerboseLogs) {
    payload.logger.info(`[payload-mcp] ⏭️ ${toolName} Tool Skipped.`)
  }
}
