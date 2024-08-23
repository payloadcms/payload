import type { SanitizedConfig } from '../config/types.js'

import { getPayload } from '../index.js'
import { getLogger } from '../utilities/logger.js'

export async function removePreferences(
  config: SanitizedConfig,
  options?: { log: boolean },
): Promise<void> {
  const logger = getLogger()
  const shouldLog = options?.log ?? true
  const payload = await getPayload({ config })

  if (shouldLog) logger.info('Removing all user preferences...')

  await payload.delete({
    collection: 'payload-preferences',
    where: {},
  })

  if (shouldLog) logger.info(`All user preferences removed.`)
  process.exit(1)
}
