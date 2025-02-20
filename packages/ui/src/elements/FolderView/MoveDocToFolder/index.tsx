'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { MoveFolderIcon } from '../../../icons/MoveFolder/index.js'
import { Button } from '../../Button/index.js'
import { MoveToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import './index.scss'

const baseClass = 'move-doc-to-folder'
const moveDocToFolderDrawerSlug = 'move-doc-to-folder'

type Props = {
  className?: string
  onConfirm: (folderID: number | string) => Promise<void> | void
}

export function MoveDocToFolder({ className = '', onConfirm }: Props) {
  const { closeModal, openModal } = useModal()
  return (
    <>
      <div className={`${baseClass} ${className}`.trim()}>
        <Button buttonStyle="none" onClick={() => openModal(moveDocToFolderDrawerSlug)}>
          <MoveFolderIcon />
        </Button>
      </div>

      <MoveToFolderDrawer
        count={1}
        drawerSlug={moveDocToFolderDrawerSlug}
        hiddenFolderIDs={[]}
        onMoveConfirm={(folderIDToMove) => {
          void onConfirm(folderIDToMove)
          closeModal(moveDocToFolderDrawerSlug)
        }}
      />
    </>
  )
}
