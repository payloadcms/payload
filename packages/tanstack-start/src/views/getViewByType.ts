import type { ComponentType } from 'react'

import type { SerializablePageState } from './Root/types.js'

import { AccountView } from './Account/index.js'
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
    case 'document':
      return DocumentView
    case 'list':
    case 'trash':
      return ListView
    default:
      return undefined
  }
}
