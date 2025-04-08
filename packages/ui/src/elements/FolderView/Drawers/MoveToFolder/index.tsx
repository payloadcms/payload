'use client'

import { useModal } from '@faceless-ui/modal'
import { extractID } from 'payload/shared'
import React from 'react'

import type { PolymorphicRelationshipValue } from '../../types.js'

import { FolderIcon } from '../../../../icons/Folder/index.js'
import { useFolder } from '../../../../providers/Folders/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ConfirmationModal } from '../../../ConfirmationModal/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { Translation } from '../../../Translation/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { DisplayItems } from '../../DisplayItems/index.js'
import { DrawerWithFolderContext } from '../DrawerWithFolderContext.js'
import './index.scss'

const baseClass = 'move-folder-drawer'
const confirmModalSlug = 'move-folder-drawer-confirm'

type Props = {
  readonly drawerSlug: string
  readonly itemsToMove: PolymorphicRelationshipValue[]
  readonly onMoveConfirm: (folderID: number | string) => Promise<void> | void
}
export const MoveToFolderDrawer = DrawerWithFolderContext<Props>((props) => {
  const { drawerSlug, itemsToMove, onMoveConfirm } = props
  const [count] = React.useState(() => itemsToMove.length)
  const folderContext = useFolder()
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()

  const getSelectedFolder = React.useCallback(
    ({ key }: { key: 'id' | 'name' }) => {
      let value =
        key === 'id'
          ? folderContext?.folderID || null
          : folderContext?.breadcrumbs?.[folderContext.breadcrumbs.length - 1]?.name || ''
      if (folderContext.selectedIndexes.size > 0) {
        const index = Array.from(folderContext.selectedIndexes).pop()
        if (typeof index === 'number') {
          const folderObject = folderContext.subfolders[index].value
          const folderID = extractID(folderObject)
          value =
            key === 'id'
              ? folderID
              : typeof folderObject === 'object'
                ? folderObject.name
                : folderID
        }
      }

      return value
    },
    [
      folderContext?.breadcrumbs,
      folderContext?.folderID,
      folderContext?.selectedIndexes,
      folderContext?.subfolders,
    ],
  )

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
        <FolderBreadcrumbs
          breadcrumbs={[
            {
              id: null,
              name: <FolderIcon />,
              onClick: () => {
                void folderContext.setFolderID({ folderID: null })
              },
            },
            ...folderContext.breadcrumbs.map((crumb) => ({
              id: crumb.id,
              name: crumb.name,
              onClick: () => {
                void folderContext.setFolderID({ folderID: crumb.id })
              },
            })),
          ]}
        />

        <div>
          <DisplayItems
            collectionUseAsTitles={folderContext.collectionUseAsTitles}
            disabledItems={itemsToMove}
            folderCollectionSlug={folderContext.folderCollectionSlug}
            selectedItems={folderContext.getSelectedItems()}
            setFolderID={folderContext.setFolderID}
            subfolders={folderContext.subfolders}
            viewType="grid"
          />
        </div>
      </DrawerContentContainer>

      <ConfirmationModal
        body={
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:moveConfirm"
            t={t}
            variables={{
              count,
              destination: getSelectedFolder({ key: 'name' }),
              label: count > 1 ? t('general:items') : t('general:item'),
            }}
          />
        }
        confirmingLabel={t('general:moving')}
        heading={t('general:moveCount', {
          count,
          label: count > 1 ? t('general:items') : t('general:item'),
        })}
        modalSlug={confirmModalSlug}
        onConfirm={async () => {
          await onMoveConfirm(getSelectedFolder({ key: 'id' }))
        }}
      />
    </>
  )
})
