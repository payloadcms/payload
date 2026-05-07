import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { globalsComponentsEdit } from './transforms/globals-components-edit/index.js'
import { migrateForceSelect } from './transforms/migrate-force-select/index.js'
import { migrateHideAPIURL } from './transforms/migrate-hide-api-url/index.js'
import { migrateListViewSelectAPI } from './transforms/migrate-list-view-select-api/index.js'

export const transforms: Transform[] = [
  exampleNoop,
  migrateHideAPIURL,
  globalsComponentsEdit,
  migrateListViewSelectAPI,
  migrateForceSelect,
]
