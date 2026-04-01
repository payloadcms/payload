import type React from 'react'

import type { BuildCollectionFolderViewStateArgs } from './buildView.js'

import { buildCollectionFolderView } from './buildView.js'

export type { BuildCollectionFolderViewStateArgs }

/**
 * Framework-agnostic CollectionFolderView.
 * Throws Error('not-found') instead of calling framework-specific notFound().
 */
export const CollectionFolderView: React.FC<BuildCollectionFolderViewStateArgs> = async (args) => {
  try {
    const { View } = await buildCollectionFolderView(args)
    return View
  } catch (error) {
    if (error?.message === 'not-found') {
      throw error
    }
    console.error(error) // eslint-disable-line no-console
    throw error
  }
}
