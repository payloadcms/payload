'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { PublishManyDrawerContent } from './DrawerContent.js'

export type PublishManyProps = {
  collection: ClientCollectionConfig
  count?: number
  ids?: (number | string)[]
  /**
   * When multiple PublishMany components are rendered on the page, this will differentiate them.
   */
  modalPrefix?: string
  onSuccess?: () => void
  selectAll?: boolean
  where?: Where
}

export const PublishMany: React.FC<PublishManyProps> = (props) => {
  const { count, selectAll, selectedIDs, toggleAll } = useSelection()

  const {
    collection,
    collection: { slug, versions } = {},
    count: countFromProps,
    ids: idsFromProps,
    modalPrefix,
    onSuccess,
    selectAll: selectAllFromProps,
    where,
  } = props

  const resolvedCount = countFromProps ?? count
  const resolvedIDs = idsFromProps ?? selectedIDs
  const resolvedOnSuccess = onSuccess ?? (() => toggleAll())
  const resolvedSelectAll = selectAllFromProps ?? selectAll === SelectAllStatus.AllAvailable

  const { permissions } = useAuth()
  const { t } = useTranslation()

  const { openModal } = useModal()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update

  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}publish-${slug}`

  if (!versions?.drafts || resolvedCount === 0 || !hasPermission) {
    return null
  }

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('version:publish')}
        onClick={() => {
          openModal(drawerSlug)
        }}
      >
        {t('version:publish')}
      </ListSelectionButton>
      <PublishManyDrawerContent
        collection={collection}
        drawerSlug={drawerSlug}
        ids={resolvedIDs}
        onSuccess={resolvedOnSuccess}
        selectAll={resolvedSelectAll}
        where={where}
      />
    </React.Fragment>
  )
}
