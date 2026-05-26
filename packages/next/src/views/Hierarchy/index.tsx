import type { AdminViewServerProps, ListQuery } from 'payload'
import type React from 'react'

import { notFound } from 'next/navigation.js'

import { renderListView } from '../List/index.js'

type RenderHierarchyViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  redirectAfterRestore?: boolean
} & AdminViewServerProps

export const HierarchyView: React.FC<Omit<RenderHierarchyViewArgs, 'enableRowSelections'>> = async (
  args,
) => {
  try {
    const { List: HierarchyList } = await renderListView({
      ...args,
      enableRowSelections: true,
      viewType: 'hierarchy',
    })

    return HierarchyList
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    }
    console.error(error) // eslint-disable-line no-console
  }
}
