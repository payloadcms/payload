import type React from 'react'

import { notFound } from 'next/navigation.js'

import type { BuildFolderViewArgs } from './buildView.js'

import { buildFolderView } from './buildView.js'

export const FolderView: React.FC<BuildFolderViewArgs> = async (args) => {
  try {
    const { View } = await buildFolderView(args)
    return View
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
