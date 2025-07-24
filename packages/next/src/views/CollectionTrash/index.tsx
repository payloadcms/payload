import type { AdminViewServerProps, ListQuery } from 'payload'
import type React from 'react'

import { notFound } from 'next/navigation.js'

import { renderListView } from '../List/index.js'

type RenderTrashViewArgs = {
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

export const TrashView: React.FC<
  { query?: any } & Omit<RenderTrashViewArgs, 'enableRowSelections'>
> = async (args) => {
  try {
    const { List: TrashList } = await renderListView({
      ...args,
      enableRowSelections: true,
      query: {
        ...(args.query || {}),
        trash: true, // force trash view
      },
      viewType: 'trash',
    })

    return TrashList
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    }
    console.error(error) // eslint-disable-line no-console
  }
}
