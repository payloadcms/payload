'use client'

import React, { Fragment } from 'react'

import { DeleteMany_v4 } from '../../../elements/DeleteMany/index.js'
import { useDocumentDrawer } from '../../../elements/DocumentDrawer/index.js'
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
  taxonomySlug?: string
}

export const DocumentListSelection: React.FC<DocumentListSelectionProps> = ({
  disableBulkDelete,
  disableBulkEdit,
  taxonomySlug,
}) => {
  const { clearAll, getSelectionsForActions, getTotalCount } = useDocumentSelection()
  const { clearRouteCache } = useRouteCache()
  const { config } = useConfig()
  const { t } = useTranslation()

  const count = getTotalCount()
  const groupedSelections = getSelectionsForActions()

  const collectionSlugs = Object.keys(groupedSelections)
  const singleCollectionSelected = collectionSlugs.length === 1
  const singleCollectionSlug = singleCollectionSelected ? collectionSlugs[0] : null

  const collectionConfig = singleCollectionSlug
    ? config.collections.find((collection) => collection.slug === singleCollectionSlug)
    : null

  const ids = singleCollectionSelected ? groupedSelections[singleCollectionSlug]?.ids || [] : []

  // Check if single taxonomy item is selected (for direct edit)
  // Only available when taxonomySlug is provided
  const singleTaxonomySelected =
    taxonomySlug && singleCollectionSlug === taxonomySlug && ids.length === 1 ? ids[0] : null

  const [TaxonomyDocDrawer, , { openDrawer }] = useDocumentDrawer({
    id: singleTaxonomySelected ?? undefined,
    collectionSlug: taxonomySlug || singleCollectionSlug || '',
  })

  if (count === 0) {
    return null
  }

  const handleActionSuccess = () => {
    clearRouteCache() // This already calls router.refresh()
    clearAll()
  }

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        <ListSelectionButton key="clear-all" onClick={() => clearAll()}>
          {t('general:clearAll')}
        </ListSelectionButton>,
      ]}
      SelectionActions={[
        // Single taxonomy item selected - show direct edit button
        singleTaxonomySelected && (
          <Fragment key="single-edit">
            <ListSelectionButton onClick={openDrawer}>{t('general:edit')}</ListSelectionButton>
            <TaxonomyDocDrawer onSave={handleActionSuccess} />
          </Fragment>
        ),
        // Multiple items or non-taxonomy items - show bulk actions
        !disableBulkEdit &&
          !singleTaxonomySelected &&
          singleCollectionSelected &&
          collectionConfig &&
          ids.length > 0 && (
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
