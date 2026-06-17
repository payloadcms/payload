'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { UnpublishManyDrawerContent } from './DrawerContent.js'

export type UnpublishManyProps = {
  collection: ClientCollectionConfig
  count: number
  ids: (number | string)[]
  /**
   * When multiple UnpublishMany components are rendered on the page, this will differentiate them.
   */
  modalPrefix?: string
  onSuccess?: () => void
  selectAll: boolean
  where?: Where
}

export const UnpublishMany: React.FC<UnpublishManyProps> = (props) => {
  const {
    collection,
    collection: { slug, versions } = {},
    count,
    ids,
    modalPrefix,
    onSuccess,
    selectAll,
    where,
  } = props

  const { t } = useTranslation()
  const { permissions } = useAuth()
  const { toggleModal } = useModal()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update

  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}unpublish-${slug}`

  if (!versions?.drafts || count === 0 || !hasPermission) {
    return null
  }

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('version:unpublish')}
        onClick={() => {
          toggleModal(drawerSlug)
        }}
      >
        {t('version:unpublish')}
      </ListSelectionButton>
      <UnpublishManyDrawerContent
        collection={collection}
        drawerSlug={drawerSlug}
        ids={ids}
        onSuccess={onSuccess}
        selectAll={selectAll}
        where={where}
      />
    </React.Fragment>
  )
}
