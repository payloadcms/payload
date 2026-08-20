import type { CLIRuntime } from '../../../config/types.js'
import type { BaseDatabaseAdapter } from '../../../database/types.js'
import type { Payload } from '../../../index.js'

import { prettySyncLoggerDestination } from '../../../utilities/logger.js'

const prettySyncLogger = {
  loggerDestination: prettySyncLoggerDestination,
  loggerOptions: {},
}

export const initializeMigration = async ({
  disableDBConnect = false,
  getPayload,
}: {
  disableDBConnect?: boolean
  getPayload: CLIRuntime['getPayload']
}): Promise<{ adapter: BaseDatabaseAdapter; payload: Payload }> => {
  process.env.PAYLOAD_MIGRATING = 'true'

  const payload = await getPayload({
    disableDBConnect,
    disableOnInit: true,
    ...prettySyncLogger,
  })

  const adapter = payload.db

  if (!adapter) {
    throw new Error('No database adapter found')
  }

  return { adapter, payload }
}
