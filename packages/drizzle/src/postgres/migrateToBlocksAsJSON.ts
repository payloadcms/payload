import { createBlocksToJsonMigrator } from '../utilities/createBlocksToJsonMigrator.js'
import { setColumnID } from './schema/setColumnID.js'

export const migrateToBlocksAsJSON = createBlocksToJsonMigrator(setColumnID)
