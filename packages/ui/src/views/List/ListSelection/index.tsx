'use client'
import type { ClientCollectionConfig, ViewTypes, Where } from 'payload'

import * as qs from 'qs-esm'
import React, { Fragment, useCallback } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany } from '../../../elements/PublishMany/index.js'
import { RestoreMany } from '../../../elements/RestoreMany/index.js'
import { UnpublishMany } from '../../../elements/UnpublishMany/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useRouter, useSearchParams } from '../../../providers/RouterAdapter/index.js'
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { parseSearchParams } from '../../../utilities/parseSearchParams.js'

export type ListSelectionProps = {
  /** Base filter of the list view; bulk actions across pages must respect it */
  baseFilter?: Where
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
  baseFilter,
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
  const urlWhere = parseSearchParams(searchParams)?.where as Where

  // Bulk actions across pages resolve documents server-side, so they must carry
  // the same base filter the list applies; otherwise they also hit documents
  // the list never shows. See https://github.com/payloadcms/payload/issues/19189.
  const baseFilterConstraints = [baseFilter, where].filter(
    (constraint): constraint is Where => !!constraint && Object.keys(constraint).length > 0,
  )

  const urlWhereConstraints = Array.isArray(urlWhere?.and)
    ? urlWhere.and
    : urlWhere
      ? [urlWhere]
      : []

  const deleteWhere: undefined | Where =
    viewType === 'trash'
      ? { and: [...baseFilterConstraints, ...urlWhereConstraints, { deletedAt: { exists: true } }] }
      : baseFilterConstraints.length === 0
        ? urlWhere
        : { and: [...baseFilterConstraints, ...urlWhereConstraints] }

  const bulkActionsWhere: undefined | Where =
    baseFilterConstraints.length === 0
      ? undefined
      : baseFilterConstraints.length === 1
        ? baseFilterConstraints[0]
        : { and: baseFilterConstraints }

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
              where={bulkActionsWhere}
            />
            <PublishMany
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={bulkActionsWhere}
            />
            <UnpublishMany
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={bulkActionsWhere}
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

              void router.replace(
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
