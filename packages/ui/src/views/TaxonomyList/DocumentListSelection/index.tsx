'use client'

import React, { Fragment } from 'react'

import { DeleteMany_v4 } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export type DocumentListSelectionProps = {
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
}

export const DocumentListSelection: React.FC<DocumentListSelectionProps> = ({
  disableBulkDelete,
  disableBulkEdit,
}) => {
  const { clearAll, getSelectionsForActions, getTotalCount } = useDocumentSelection()
  const { clearRouteCache } = useRouteCache()
  const { config } = useConfig()
  const { t } = useTranslation()

  const count = getTotalCount()
  const groupedSelections = getSelectionsForActions()

  if (count === 0) {
    return null
  }

  const handleActionSuccess = () => {
    clearRouteCache()
    clearAll()
  }

  const collectionSlugs = Object.keys(groupedSelections)
  const singleCollectionSelected = collectionSlugs.length === 1
  const singleCollectionSlug = singleCollectionSelected ? collectionSlugs[0] : null

  const collectionConfig = singleCollectionSlug
    ? config.collections.find((collection) => collection.slug === singleCollectionSlug)
    : null

  const ids = singleCollectionSelected ? groupedSelections[singleCollectionSlug]?.ids || [] : []

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        <ListSelectionButton key="clear-all" onClick={() => clearAll()}>
          {t('general:clearAll')}
        </ListSelectionButton>,
      ]}
      SelectionActions={[
        !disableBulkEdit && singleCollectionSelected && collectionConfig && ids.length > 0 && (
          <Fragment key="bulk-actions">
            <EditMany_v4
              collection={collectionConfig}
              count={ids.length}
              ids={ids}
              modalPrefix="taxonomy-list"
              onSuccess={handleActionSuccess}
              selectAll={false}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={ids.length}
              ids={ids}
              modalPrefix="taxonomy-list"
              onSuccess={handleActionSuccess}
              selectAll={false}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={ids.length}
              ids={ids}
              modalPrefix="taxonomy-list"
              onSuccess={handleActionSuccess}
              selectAll={false}
            />
          </Fragment>
        ),
        !disableBulkDelete && (
          <DeleteMany_v4
            afterDelete={handleActionSuccess}
            key="bulk-delete"
            modalPrefix="taxonomy-list"
            selections={groupedSelections}
          />
        ),
      ].filter(Boolean)}
    />
  )
}
