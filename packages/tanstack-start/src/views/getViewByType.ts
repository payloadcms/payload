import type { ComponentType } from 'react'

import type { SerializablePageState } from './Root/types.js'

import { AccountView } from './Account/index.js'
import { BrowseByFolderView } from './BrowseByFolder/index.js'
import { CollectionFoldersView } from './CollectionFolders/index.js'
import { DocumentView } from './Document/index.js'
import { ListView } from './List/index.js'

type TanStackPageViewComponent = ComponentType<{
  pageState: SerializablePageState
}>

export const getViewByType = (
  viewType: SerializablePageState['viewType'],
): TanStackPageViewComponent | undefined => {
  switch (viewType) {
    case 'account':
      return AccountView
    case 'collection-folders':
      return CollectionFoldersView
    case 'document':
    case 'version':
      return DocumentView
    case 'folders':
      return BrowseByFolderView
    case 'list':
    case 'trash':
      return ListView
    default:
      return undefined
  }
}
