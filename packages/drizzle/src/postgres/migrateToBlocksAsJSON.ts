import { createBlocksToJsonMigrator } from '../utilities/migrateToBlocksAsJSON.js'
import { setColumnID } from './schema/setColumnID.js'

export const migrateToBlocksAsJSON = createBlocksToJsonMigrator(setColumnID)
