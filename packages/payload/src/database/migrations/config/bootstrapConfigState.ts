import type { Payload } from '../../../types/index.js'
import type { ConfigSnapshot } from './types.js'

import { writeConfigState } from './configStateStore.js'
import { serializeConfig } from './serializeConfig.js'

export async function bootstrapConfigState(
  payload: Payload,
  migrationDir: string,
): Promise<ConfigSnapshot> {
  const snapshot = serializeConfig(payload.config)
  await writeConfigState(migrationDir, snapshot)
  payload.logger.info(
    '[payload migrate] Initialised config state snapshot (first run). No data migrations generated.',
  )
  return snapshot
}
