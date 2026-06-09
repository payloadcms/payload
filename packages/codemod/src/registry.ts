import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { globalsComponentsEdit } from './transforms/globals-components-edit/index.js'
import { migrateAliasedExports } from './transforms/migrate-aliased-exports/index.js'
import { migrateBuildScript } from './transforms/migrate-build-script/index.js'
import { migrateDbTypesSubpath } from './transforms/migrate-db-types-subpath/index.js'
import { migrateDisabledFields } from './transforms/migrate-disabled-fields/index.js'
import { migrateDocumentTitleContext } from './transforms/migrate-document-title-context/index.js'
import { migrateForceSelect } from './transforms/migrate-force-select/index.js'
import { migrateHideAPIURL } from './transforms/migrate-hide-api-url/index.js'
import { migrateImportExportHooks } from './transforms/migrate-import-export-hooks/index.js'
import { migrateListViewSelectAPI } from './transforms/migrate-list-view-select-api/index.js'
import { migrateNextSubpathExports } from './transforms/migrate-next-subpath-exports/index.js'
import { migrateStorageAdaptersToConfig } from './transforms/migrate-storage-adapters-to-config/index.js'
import { migrateVersionsDefault } from './transforms/migrate-versions-default/index.js'
import { removeGroupByTrue } from './transforms/remove-group-by-true/index.js'
import { removeVersionsTrue } from './transforms/remove-versions-true/index.js'
import { renameStorageAdaptersToStorage } from './transforms/rename-storage-adapters-to-storage/index.js'
import { renameTypescriptSchemaToJsonSchema } from './transforms/rename-typescript-schema-to-json-schema/index.js'

export const transforms: Transform[] = [
  exampleNoop,
  migrateHideAPIURL,
  globalsComponentsEdit,
  migrateListViewSelectAPI,
  migrateDisabledFields,
  migrateForceSelect,
  migrateAliasedExports,
  migrateBuildScript,
  migrateDocumentTitleContext,
  migrateStorageAdaptersToConfig,
  renameStorageAdaptersToStorage,
  migrateImportExportHooks,
  migrateDbTypesSubpath,
  migrateNextSubpathExports,
  migrateVersionsDefault,
  removeGroupByTrue,
  removeVersionsTrue,
  renameTypescriptSchemaToJsonSchema,
]
