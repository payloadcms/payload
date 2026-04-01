import type React from 'react'

import {
  type RenderListViewArgs,
  renderListView as renderListViewFromUI,
} from '@payloadcms/ui/views/List/RenderListView'
import { notFound } from 'next/navigation.js'

export type { RenderListViewArgs }

export { renderListView } from '@payloadcms/ui/views/List/RenderListView'

export const ListView: React.FC<RenderListViewArgs> = async (args) => {
  try {
    const { List: RenderedList } = await renderListViewFromUI({
      ...args,
      enableRowSelections: true,
    })
    return RenderedList
  } catch (error) {
    // Pass through Next.js errors
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
