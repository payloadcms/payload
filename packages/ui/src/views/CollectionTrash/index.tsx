import type { AdminViewServerProps, ListQuery } from 'payload'
import type React from 'react'

import { renderListView } from '../List/RenderListView.js'

type RenderTrashViewArgs = {
  customCellProps?: Record<string, unknown>
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

/**
 * Framework-agnostic TrashView.
 * Throws Error('not-found') instead of calling framework-specific notFound().
 */
export const TrashView: React.FC<Omit<RenderTrashViewArgs, 'enableRowSelections'>> = async (
  args,
) => {
  try {
    const { List: TrashList } = await renderListView({
      ...args,
      enableRowSelections: true,
      trash: true,
      viewType: 'trash',
    })

    return TrashList
  } catch (error) {
    if (error.message === 'not-found') {
      throw error
    }
    console.error(error) // eslint-disable-line no-console
    throw error
  }
}
