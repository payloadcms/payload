import type { ImportMap } from 'payload'

import { importMap as clientImportMap } from './importMap.js'

// The server needs access to the full import map so that server components
// can be resolved during getAdminPageData and server function handlers.
export const importMap: ImportMap = clientImportMap as ImportMap
