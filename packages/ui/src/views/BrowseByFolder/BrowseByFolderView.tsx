import type React from 'react'

import type { BuildFolderViewArgs } from './buildView.js'

import { buildBrowseByFolderView } from './buildView.js'

export type { BuildFolderViewArgs }

/**
 * Framework-agnostic BrowseByFolder server component.
 * Throws Error('not-found') instead of calling framework-specific notFound().
 */
export const BrowseByFolder: React.FC<BuildFolderViewArgs> = async (args) => {
  try {
    const { View } = await buildBrowseByFolderView(args)
    return View
  } catch (error) {
    if (error?.message === 'not-found') {
      throw error
    }
    console.error(error) // eslint-disable-line no-console
    throw error
  }
}
