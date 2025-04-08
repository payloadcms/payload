'use client'

import type { FolderBreadcrumb } from 'payload/shared'

import React from 'react'

import type { FolderContextValue } from '../../providers/Folders/index.js'

import { useFolder } from '../../providers/Folders/index.js'

/**
 * The Folder Provider wraps the entire app
 * but each folder-collection page loads its own data
 */

type Props = {
  breadcrumbs?: FolderBreadcrumb[]
  documents?: FolderContextValue['documents']
  folderID?: number | string
  subfolders?: FolderContextValue['subfolders']
}

export function HydrateFolderProvider({ breadcrumbs, documents, folderID, subfolders }: Props) {
  const { hydrateProvider } = useFolder()

  React.useEffect(() => {
    hydrateProvider({
      breadcrumbs,
      documents,
      folderID,
      subfolders,
    })
  }, [breadcrumbs, documents, folderID, hydrateProvider, subfolders])

  return null
}
