import type { AdminViewServerProps, ListQuery } from 'payload'
import type React from 'react'

import { renderListView } from '@payloadcms/ui/views/List'
import { notFound } from 'next/navigation.js'

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
