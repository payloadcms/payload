import type React from 'react'

import { notFound } from 'next/navigation.js'

import type { BuildCollectionFolderViewStateArgs } from './components/buildCollectionFolderView.js'

import { buildCollectionFolderView } from './components/buildCollectionFolderView.js'

export { generateFolderMetadata as generateFolderListMetadata } from './meta.js'

export const CollectionFolderView: React.FC<BuildCollectionFolderViewStateArgs> = async (args) => {
  try {
    const { View } = await buildCollectionFolderView(args)
    return View
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
