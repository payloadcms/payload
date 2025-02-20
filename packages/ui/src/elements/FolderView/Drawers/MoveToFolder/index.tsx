'use client'

import { useModal } from '@faceless-ui/modal'
import { extractID } from 'payload/shared'
import React from 'react'

import { useFolder } from '../../../../providers/Folders/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ConfirmationModal } from '../../../ConfirmationModal/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { DisplayItems } from '../../DisplayItems/index.js'
import { DrawerWithFolderContext } from '../DrawerWithFolderContext.js'
import './index.scss'

const baseClass = 'move-folder-drawer'
const confirmModalSlug = 'move-folder-drawer-confirm'

type Props = {
  readonly count: number
  readonly disabledFolderIDs: (number | string)[]
  readonly drawerSlug: string
  readonly onMoveConfirm: (folderID: number | string) => Promise<void> | void
}
export const MoveToFolderDrawer = DrawerWithFolderContext<Props>((props) => {
  const { count, disabledFolderIDs, drawerSlug, onMoveConfirm } = props
  const folderContext = useFolder()
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()

  return (
    <>
      <DrawerActionHeader
        onCancel={() => {
          closeModal(drawerSlug)
        }}
        onSave={() => {
          openModal(confirmModalSlug)
        }}
        saveLabel={t('folder:selectFolder')}
        title={t('general:movingCount', {
          count,
          label: count > 1 ? t('general:items') : t('general:item'),
        })}
      />

      <DrawerContentContainer className={baseClass}>
        <FolderBreadcrumbs breadcrumbs={folderContext.breadcrumbs} />

        <div>
          <DisplayItems
            allowMultiSelection={false}
            collectionUseAsTitles={folderContext.collectionUseAsTitles}
            disabledFolderIDs={disabledFolderIDs}
            folderCollectionSlug={folderContext.folderCollectionSlug}
            isMovingItems={true}
            lastSelectedIndex={folderContext.lastSelectedIndex}
            selectedIndexes={folderContext.selectedIndexes}
            setFolderID={folderContext.setFolderID}
            setLastSelectedIndex={folderContext.setLastSelectedIndex}
            setSelectedIndexes={folderContext.setSelectedIndexes}
            subfolders={folderContext.subfolders}
            viewType="grid"
          />
        </div>
      </DrawerContentContainer>

      <ConfirmationModal
        body={t('general:moveCount', {
          count,
          label: count > 1 ? t('general:items') : t('general:item'),
        })}
        confirmingLabel={t('general:moving')}
        heading={t('general:confirm')}
        modalSlug={confirmModalSlug}
        onConfirm={async () => {
          let folderToMoveTo = folderContext?.folderID || null
          if (folderContext.selectedIndexes.size > 0) {
            const index = Array.from(folderContext.selectedIndexes).pop()
            if (typeof index === 'number') {
              folderToMoveTo = extractID(folderContext.subfolders[index].value)
            }
          }

          await onMoveConfirm(folderToMoveTo)
        }}
      />
    </>
  )
})
