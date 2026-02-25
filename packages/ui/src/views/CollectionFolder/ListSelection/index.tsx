'use client'

import type { CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { extractID } from 'payload/shared'
import React, { Fragment } from 'react'
import { toast } from 'sonner'

import { DeleteMany_v4 } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { EditFolderAction } from '../../../elements/FolderView/Drawers/EditFolderAction/index.js'
import { MoveItemsToFolderDrawer } from '../../../elements/FolderView/Drawers/MoveToFolder/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const moveToFolderDrawerSlug = 'move-to-folder--list'

type GroupedSelections = {
  [relationTo: string]: {
    all?: boolean
    ids?: (number | string)[]
    totalCount: number
  }
}

export type ListSelectionProps = {
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  folderAssignedCollections: CollectionSlug[]
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  disableBulkDelete,
  disableBulkEdit,
  folderAssignedCollections,
}) => {
  const {
    clearSelections,
    currentFolder,
    folderCollectionSlug,
    folderFieldName,
    folderID,
    getSelectedItems,
    moveToFolder,
  } = useFolder()

  const { clearRouteCache } = useRouteCache()
  const { config } = useConfig()
  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const items = getSelectedItems()

  const groupedSelections: GroupedSelections = items.reduce((acc, item) => {
    if (item) {
      if (acc[item.relationTo]) {
        acc[item.relationTo].ids.push(extractID(item.value))
        acc[item.relationTo].totalCount += 1
      } else {
        acc[item.relationTo] = {
          ids: [extractID(item.value)],
          totalCount: 1,
        }
      }
    }

    return acc
  }, {} as GroupedSelections)

  const count = items.length
  const singleNonFolderCollectionSelected =
    Object.keys(groupedSelections).length === 1 &&
    Object.keys(groupedSelections)[0] !== folderCollectionSlug
  const collectionConfig = singleNonFolderCollectionSelected
    ? config.collections.find((collection) => {
        return collection.slug === Object.keys(groupedSelections)[0]
      })
    : null

  if (count === 0) {
    return null
  }

  const ids = singleNonFolderCollectionSelected
    ? groupedSelections[Object.keys(groupedSelections)[0]]?.ids || []
    : []

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        count > 0 && (
          <ListSelectionButton key="clear-all" onClick={() => clearSelections()}>
            {t('general:clearAll')}
          </ListSelectionButton>
        ),
      ].filter(Boolean)}
      SelectionActions={[
        !disableBulkEdit && ids.length && (
          <Fragment key="bulk-actions">
            <EditMany_v4 collection={collectionConfig} count={count} ids={ids} selectAll={false} />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={ids}
              selectAll={false}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={ids}
              selectAll={false}
            />
          </Fragment>
        ),
        count === 1 && !singleNonFolderCollectionSelected && (
          <EditFolderAction
            folderCollectionSlug={folderCollectionSlug}
            id={groupedSelections[folderCollectionSlug].ids[0]}
            key="edit-folder-action"
          />
        ),
        count > 0 ? (
          <React.Fragment key={moveToFolderDrawerSlug}>
            <ListSelectionButton
              onClick={() => {
                openModal(moveToFolderDrawerSlug)
              }}
              type="button"
            >
              {t('general:move')}
            </ListSelectionButton>

            <MoveItemsToFolderDrawer
              action="moveItemsToFolder"
              drawerSlug={moveToFolderDrawerSlug}
              folderAssignedCollections={folderAssignedCollections}
              folderCollectionSlug={folderCollectionSlug}
              folderFieldName={folderFieldName}
              fromFolderID={folderID}
              fromFolderName={currentFolder?.value?._folderOrDocumentTitle}
              itemsToMove={getSelectedItems()}
              onConfirm={async ({ id, name }) => {
                await moveToFolder({
                  itemsToMove: getSelectedItems(),
                  toFolderID: id,
                })

                if (id) {
                  // moved to folder
                  toast.success(
                    t('folder:itemsMovedToFolder', {
                      folderName: `"${name}"`,
                      title: `${count} ${count > 1 ? t('general:items') : t('general:item')}`,
                    }),
                  )
                } else {
                  // moved to root
                  toast.success(
                    t('folder:itemsMovedToRoot', {
                      title: `${count} ${count > 1 ? t('general:items') : t('general:item')}`,
                    }),
                  )
                }

                clearRouteCache()
                closeModal(moveToFolderDrawerSlug)
              }}
            />
          </React.Fragment>
        ) : null,
        !disableBulkDelete && (
          <DeleteMany_v4
            afterDelete={() => {
              clearRouteCache()
              clearSelections()
            }}
            hasDeletePermission={true}
            key="bulk-delete"
            selections={groupedSelections}
          />
        ),
      ].filter(Boolean)}
    />
  )
}
