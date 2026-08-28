import type { CLIRuntime } from '../../../config/types.js'
import type { BaseDatabaseAdapter } from '../../../database/types.js'
import type { Payload } from '../../../index.js'

export const initializeMigration = async ({
  disableAPIKeyStartupGuard = false,
  disableDBConnect = false,
  getPayload,
}: {
  disableAPIKeyStartupGuard?: boolean
  disableDBConnect?: boolean
  getPayload: CLIRuntime['getPayload']
}): Promise<{ adapter: BaseDatabaseAdapter; payload: Payload }> => {
  process.env.PAYLOAD_MIGRATING = 'true'

  const payload = await getPayload({
    disableAPIKeyStartupGuard,
    disableDBConnect,
    disableOnInit: true,
  })

  const adapter = payload.db

  if (!adapter) {
    throw new Error('No database adapter found')
  }

  return { adapter, payload }
}
