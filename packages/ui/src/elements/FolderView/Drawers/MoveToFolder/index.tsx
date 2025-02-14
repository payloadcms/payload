'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useFolder } from '../../../../providers/Folders/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { FolderFileCard } from '../../FolderFileCard/index.js'
import { FolderFileGrid } from '../../FolderFileGrid/index.js'
import { strings } from '../../strings.js'
import { DrawerWithFolderContext } from '../DrawerWithFolderContext.js'
import './index.scss'

const baseClass = 'move-folder-drawer'

type Props = {
  readonly drawerSlug: string
  readonly hiddenFolderIDs: (number | string)[]
  readonly onMoveConfirm: (folderID: number | string) => Promise<void>
}
export const MoveToFolderDrawer = DrawerWithFolderContext<Props>((props) => {
  const { drawerSlug, hiddenFolderIDs, onMoveConfirm } = props
  const { breadcrumbs, folderID, setFolderID, subfolders } = useFolder()
  const { closeModal } = useModal()
  const [selectedFolderID, setSelectedFolderID] = React.useState<null | number | string>(folderID)
  const lastClickTime = React.useRef(0)

  const onFolderClick = React.useCallback(
    async (id: number | string) => {
      const now = Date.now()

      // set folder on double click
      if (now - lastClickTime.current < 400 && selectedFolderID === id) {
        await setFolderID({ folderID: id })
      } else {
        setSelectedFolderID(selectedFolderID === id ? folderID : id)
      }
      lastClickTime.current = now
    },
    [setFolderID, selectedFolderID, folderID],
  )

  return (
    <>
      <DrawerActionHeader
        onCancel={() => {
          closeModal(drawerSlug)
        }}
        onSave={async () => {
          await onMoveConfirm(selectedFolderID)
        }}
        saveLabel={strings.selectFolder}
        title={strings.moveTo}
      />

      <DrawerContentContainer className={baseClass}>
        <FolderBreadcrumbs breadcrumbs={breadcrumbs} />

        <div>
          <FolderFileGrid>
            {subfolders.length
              ? subfolders.map((subfolder, index) => {
                  if (hiddenFolderIDs.includes(subfolder.value.id)) {
                    return null
                  }
                  return (
                    <FolderFileCard
                      id={subfolder.value.id}
                      isSelected={selectedFolderID === subfolder.value.id}
                      key={index}
                      onClick={async () => {
                        await onFolderClick(subfolder.value.id)
                      }}
                      title={subfolder.value.name}
                      type="folder"
                    />
                  )
                })
              : null}
          </FolderFileGrid>
        </div>
      </DrawerContentContainer>
    </>
  )
})
