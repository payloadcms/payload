import type { Payload } from 'payload'

import { findPluginConfig } from './getPluginConfig.js'

/**
 * Get the logger for the MCP plugin. Child of the main Payload logger, prefixed with `[plugin-mcp]`
 * and tagged with a structured `plugin: 'mcp'` field. When `verboseLogs` is off, info/debug calls
 * are silenced; warn/error still surface so operators don't lose error signal.
 */
export const getLogger: (args: { payload: Payload }) => Payload['logger'] = ({ payload }) => {
  const useVerboseLogs = findPluginConfig({ config: payload.config })?.mcp?.verboseLogs ?? false

  const logger = payload.logger.child({ plugin: 'mcp' }, { msgPrefix: '[plugin-mcp] ' })

  if (!useVerboseLogs) {
    logger.level = 'warn'
  }

  return logger
}
