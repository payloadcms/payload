'use client'

import type { Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { extractID } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment } from 'react'

import { DeleteMany_v4 } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { MoveItemsToFolderDrawer } from '../../../elements/FolderView/Drawers/MoveToFolder/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { parseSearchParams } from '../../../utilities/parseSearchParams.js'

const moveToFolderDrawerSlug = 'move-to-folder'

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
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  disableBulkDelete,
  disableBulkEdit,
}) => {
  const { clearSelections, getSelectedItems, moveToFolder } = useFolder()
  const { config } = useConfig()
  const { t } = useTranslation()
  const { openModal } = useModal()
  const items = getSelectedItems()
  const router = useRouter()

  const { clearRouteCache } = useRouteCache()
  const searchParams = useSearchParams()
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
    Object.keys(groupedSelections)[0] !== config.folders.slug
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
        !disableBulkDelete && (
          <DeleteMany_v4
            afterDelete={() => {
              // router.replace(
              //   qs.stringify(parseSearchParams(searchParams), { addQueryPrefix: true }),
              // )
              clearSelections()
              clearRouteCache()
            }}
            key="bulk-delete"
            search={searchParams?.get('search')}
            selections={groupedSelections}
            where={parseSearchParams(searchParams)?.where as Where}
          />
        ),
        count > 0 ? (
          <React.Fragment key={moveToFolderDrawerSlug}>
            <MoveItemsToFolderDrawer
              drawerSlug={moveToFolderDrawerSlug}
              folderID={null}
              itemsToMove={getSelectedItems()}
              onConfirm={async (folderID) => {
                await moveToFolder({
                  itemsToMove: getSelectedItems(),
                  toFolderID: folderID,
                })
              }}
            />
            <ListSelectionButton onClick={() => openModal(moveToFolderDrawerSlug)} type="button">
              {t('general:move')}
            </ListSelectionButton>
          </React.Fragment>
        ) : null,
        // @todo implement RENAME action
      ].filter(Boolean)}
    />
  )
}
