'use client'
import type { ClientCollectionConfig, ViewTypes, Where } from 'payload'

import * as qs from 'qs-esm'
import React, { Fragment, useCallback } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { RestoreMany } from '../../../elements/RestoreMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useRouter, useSearchParams } from '../../../providers/RouterAdapter/index.js'
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { parseSearchParams } from '../../../utilities/parseSearchParams.js'

export type ListSelectionProps = {
  collectionConfig?: ClientCollectionConfig
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  hasDeletePermission?: boolean
  hasTrashPermission?: boolean
  label: string
  modalPrefix?: string
  showSelectAllAcrossPages?: boolean
  viewType?: ViewTypes
  where?: Where
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  hasDeletePermission: hasDeletePermissionFromProps,
  hasTrashPermission: hasTrashPermissionFromProps,
  label,
  modalPrefix,
  showSelectAllAcrossPages = true,
  viewType,
  where,
}) => {
  const { count, selectAll, selectedIDs, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()
  const { permissions } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearRouteCache } = useRouteCache()

  const onActionSuccess = useCallback(() => toggleAll(), [toggleAll])

  if (count === 0) {
    return null
  }

  const isTrashView = collectionConfig?.trash && viewType === 'trash'

  const collectionPermissions = permissions?.collections?.[collectionConfig?.slug]
  const hasDeletePermission =
    hasDeletePermissionFromProps !== undefined
      ? hasDeletePermissionFromProps
      : Boolean(collectionPermissions?.delete)
  const hasTrashPermission =
    hasTrashPermissionFromProps !== undefined ? hasTrashPermissionFromProps : hasDeletePermission
  const canShowDeleteButton =
    viewType === 'trash' ? hasDeletePermission : hasDeletePermission || hasTrashPermission

  const selectingAll = selectAll === SelectAllStatus.AllAvailable
  const deleteIDs = selectingAll ? [] : selectedIDs
  const baseWhere = parseSearchParams(searchParams)?.where as Where
  const deleteWhere =
    viewType === 'trash'
      ? {
          and: [
            ...(Array.isArray(baseWhere?.and) ? baseWhere.and : baseWhere ? [baseWhere] : []),
            { deletedAt: { exists: true } },
          ],
        }
      : baseWhere

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        selectAll !== SelectAllStatus.AllAvailable &&
        count < totalDocs &&
        showSelectAllAcrossPages !== false ? (
          <ListSelectionButton
            aria-label={t('general:selectAll', { count: `(${totalDocs})`, label })}
            id="select-all-across-pages"
            key="select-all"
            onClick={() => toggleAll(true)}
          >
            {t('general:selectAll', { count: `(${totalDocs})`, label: '' })}
          </ListSelectionButton>
        ) : null,
      ].filter(Boolean)}
      SelectionActions={[
        !disableBulkEdit && !isTrashView && (
          <Fragment key="bulk-actions">
            <EditMany
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
          </Fragment>
        ),
        isTrashView && (
          <RestoreMany collection={collectionConfig} key="bulk-restore" viewType={viewType} />
        ),
        !disableBulkDelete && canShowDeleteButton && collectionConfig && (
          <DeleteMany
            afterDelete={() => {
              toggleAll()

              router.replace(
                qs.stringify(
                  {
                    ...parseSearchParams(searchParams),
                    page: selectAll ? '1' : undefined,
                  },
                  { addQueryPrefix: true },
                ),
              )

              clearRouteCache()
            }}
            hasDeletePermission={hasDeletePermission}
            hasTrashPermission={hasTrashPermission}
            key="bulk-delete"
            modalPrefix={modalPrefix}
            search={parseSearchParams(searchParams)?.search as string}
            selections={{
              [collectionConfig.slug]: {
                all: selectingAll,
                ids: deleteIDs,
                totalCount: selectingAll ? count : deleteIDs.length,
              },
            }}
            trash={collectionConfig?.trash}
            viewType={viewType}
            where={deleteWhere}
          />
        ),
      ].filter(Boolean)}
    />
  )
}
