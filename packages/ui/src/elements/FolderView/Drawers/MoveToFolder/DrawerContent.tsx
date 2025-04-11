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
import './index.scss'
import { WithFolderContext } from '../../WithFolderContext.js'

const baseClass = 'move-folder-drawer'
const confirmModalSlug = 'move-folder-drawer-confirm'

/**
 * An abstract component that can be used to render the content of the drawer.
 */
type MoveItemsToFolderDrawerContentProps = {
  drawerSlug: string
  itemsToMove: PolymorphicRelationshipValue[]
  onMoveConfirm: (folderID: number | string) => Promise<void> | void
  onNavigateToFolder: ({ folderID }: { folderID: null | number | string }) => void
}
export const MoveItemsToFolderDrawerContent =
  WithFolderContext<MoveItemsToFolderDrawerContentProps>((props) => {
    const { drawerSlug, itemsToMove, onMoveConfirm, onNavigateToFolder } = props
    const { closeModal, openModal } = useModal()
    const { t } = useTranslation()
    const {
      breadcrumbs,
      collectionUseAsTitles,
      folderCollectionSlug,
      folderID,
      getSelectedItems,
      selectedIndexes,
      subfolders,
    } = useFolder()

    const getSelectedFolder = React.useCallback(
      ({ key }: { key: 'id' | 'name' }) => {
        let value =
          key === 'id' ? folderID || null : breadcrumbs?.[breadcrumbs.length - 1]?.name || ''
        if (selectedIndexes.size > 0) {
          const index = Array.from(selectedIndexes).pop()
          if (typeof index === 'number') {
            const folderObject = subfolders[index].value
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
      [breadcrumbs, folderID, selectedIndexes, subfolders],
    )

    const count = itemsToMove.length

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

        <div className={`${baseClass}__breadcrumbs-section`}>
          <FolderBreadcrumbs
            breadcrumbs={[
              {
                id: null,
                name: <FolderIcon />,
                onClick: () => {
                  onNavigateToFolder({ folderID: null })
                },
              },
              ...breadcrumbs.map((crumb) => ({
                id: crumb.id,
                name: crumb.name,
                onClick: () => {
                  onNavigateToFolder({ folderID: crumb.id })
                },
              })),
            ]}
          />
        </div>

        <DrawerContentContainer className={`${baseClass}__body-section`}>
          <div>
            {/* @todo: possibly simplify this component below */}
            <DisplayItems
              collectionUseAsTitles={collectionUseAsTitles}
              disabledItems={itemsToMove}
              folderCollectionSlug={folderCollectionSlug}
              selectedItems={getSelectedItems()}
              setFolderID={onNavigateToFolder}
              subfolders={subfolders}
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
                destination: getSelectedFolder({ key: 'name' }) || 'Root',
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
