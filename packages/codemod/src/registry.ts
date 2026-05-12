import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { globalsComponentsEdit } from './transforms/globals-components-edit/index.js'
import { migrateAliasedExports } from './transforms/migrate-aliased-exports/index.js'
import { migrateDisabledFields } from './transforms/migrate-disabled-fields/index.js'
import { migrateDocumentTitleContext } from './transforms/migrate-document-title-context/index.js'
import { migrateForceSelect } from './transforms/migrate-force-select/index.js'
import { migrateHideAPIURL } from './transforms/migrate-hide-api-url/index.js'
import { migrateListViewSelectAPI } from './transforms/migrate-list-view-select-api/index.js'
import { migrateStorageAdaptersToConfig } from './transforms/migrate-storage-adapters-to-config/index.js'

export const transforms: Transform[] = [
  exampleNoop,
  migrateHideAPIURL,
  globalsComponentsEdit,
  migrateListViewSelectAPI,
  migrateDisabledFields,
  migrateForceSelect,
  migrateAliasedExports,
  migrateDocumentTitleContext,
  migrateStorageAdaptersToConfig,
]
