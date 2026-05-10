import type { Payload } from 'payload'

import { getLogger } from '../../utils/getLogger.js'

export const registerTool = ({
  isEnabled,
  payload,
  registrationFn,
  toolType,
}: {
  isEnabled: boolean | undefined
  payload: Payload
  registrationFn: () => void
  toolType: string
}) => {
  const logger = getLogger({ payload })

  if (isEnabled) {
    try {
      registrationFn()
      logger.info(`✅ Tool: ${toolType} Registered.`)
    } catch (error) {
      logger.error(`❌ Tool: ${toolType} Failed to register.`)
      throw error
    }
  } else {
    logger.info(`⏭️ Tool: ${toolType} Skipped.`)
  }
}
