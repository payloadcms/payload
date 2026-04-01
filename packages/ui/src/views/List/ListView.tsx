import type React from 'react'

import type { RenderListViewArgs } from './RenderListView.js'

import { renderListView } from './RenderListView.js'

export type { RenderListViewArgs }

/**
 * Framework-agnostic ListView server component.
 * Wraps renderListView — throws Error('not-found') on error instead of calling framework notFound().
 */
export const ListView: React.FC<RenderListViewArgs> = async (args) => {
  const { List: RenderedList } = await renderListView({
    ...args,
    enableRowSelections: true,
  })
  return RenderedList
}
