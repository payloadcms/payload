'use client'

import React from 'react'

import { useFolder } from '../../providers/Folders/index.js'
import { strings } from '../../strings.js'
import { FolderDrawer } from '../FolderDrawer/index.js'

export function MoveToFolderDrawer() {
  const { moveFoldersAndDocs, moveToDrawerSlug } = useFolder()

  return (
    <FolderDrawer
      drawerSlug={moveToDrawerSlug}
      listTitle={strings.moveTo}
      onSave={(moveToFolderID) => void moveFoldersAndDocs({ toFolderID: moveToFolderID })}
      title={strings.move}
    />
  )
}
