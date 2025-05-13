import type { SyncWithSearch } from '../../types.js'

import { syncDocAsSearchIndex } from '../../utilities/syncDocAsSearchIndex.js'

export const syncWithSearch: SyncWithSearch = (args) => {
  return syncDocAsSearchIndex(args)
}
