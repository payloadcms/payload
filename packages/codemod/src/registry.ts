import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { migrateHideAPIURL } from './transforms/migrate-hide-api-url/index.js'

export const transforms: Transform[] = [exampleNoop, migrateHideAPIURL]
