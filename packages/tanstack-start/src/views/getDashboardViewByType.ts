import type { ComponentType } from 'react'

import type { SerializablePageState } from './Root/types.js'

import { DashboardView } from './Dashboard/index.js'

type TanStackPageViewComponent = ComponentType<{
  pageState: SerializablePageState
}>

export const getDashboardViewByType = (
  viewType: SerializablePageState['viewType'],
): TanStackPageViewComponent | undefined => {
  switch (viewType) {
    case 'dashboard':
      return DashboardView
    default:
      return undefined
  }
}
