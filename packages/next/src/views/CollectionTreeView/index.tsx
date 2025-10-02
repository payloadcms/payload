import type React from 'react'

import { notFound } from 'next/navigation.js'

import type { BuildCollectionTreeViewStateArgs } from './buildView.js'

import { buildCollectionTreeView } from './buildView.js'

export const CollectionTreeView: React.FC<BuildCollectionTreeViewStateArgs> = async (args) => {
  try {
    const { View } = await buildCollectionTreeView(args)
    return View
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error
    }
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
