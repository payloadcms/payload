'use client'

import { useModal } from '@faceless-ui/modal'
import { extractID } from 'payload/shared'
import React from 'react'

import { useFolder } from '../../../../providers/Folders/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { DisplayItems } from '../../DisplayItems/index.js'
import { strings } from '../../strings.js'
import './index.scss'
import { DrawerWithFolderContext } from '../DrawerWithFolderContext.js'

const baseClass = 'move-folder-drawer'

type Props = {
  readonly drawerSlug: string
  readonly hiddenFolderIDs: (number | string)[]
  readonly onMoveConfirm: (folderID: number | string) => Promise<void> | void
}
export const MoveToFolderDrawer = DrawerWithFolderContext<Props>((props) => {
  const { drawerSlug, hiddenFolderIDs, onMoveConfirm } = props
  const folderContext = useFolder()
  const { closeModal } = useModal()

  const subfoldersToShow = folderContext.subfolders.filter(
    (subfolder) => !hiddenFolderIDs.includes(extractID(subfolder.value)),
  )

  return (
    <>
      <DrawerActionHeader
        onCancel={() => {
          closeModal(drawerSlug)
        }}
        onSave={async () => {
          let folderToMoveTo = folderContext?.folderID || null
          if (folderContext.selectedIndexes.size > 0) {
            const index = Array.from(folderContext.selectedIndexes).pop()
            if (typeof index === 'number') {
              folderToMoveTo = extractID(subfoldersToShow[index].value)
            }
          }

          await onMoveConfirm(folderToMoveTo)
        }}
        saveLabel={strings.selectFolder}
        title={strings.moveTo}
      />

      <DrawerContentContainer className={baseClass}>
        <FolderBreadcrumbs breadcrumbs={folderContext.breadcrumbs} />

        <div>
          <DisplayItems
            allowMultiSelection={false}
            collectionUseAsTitles={folderContext.collectionUseAsTitles}
            folderCollectionSlug={folderContext.folderCollectionSlug}
            isDragging={false}
            lastSelectedIndex={folderContext.lastSelectedIndex}
            selectedIndexes={folderContext.selectedIndexes}
            setFolderID={folderContext.setFolderID}
            setLastSelectedIndex={folderContext.setLastSelectedIndex}
            setSelectedIndexes={folderContext.setSelectedIndexes}
            subfolders={subfoldersToShow}
            viewType="grid"
          />
        </div>
      </DrawerContentContainer>
    </>
  )
})
