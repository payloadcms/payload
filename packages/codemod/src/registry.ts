import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { migrateListViewSelectAPI } from './transforms/migrate-list-view-select-api/index.js'

export const transforms: Transform[] = [exampleNoop, migrateListViewSelectAPI]
