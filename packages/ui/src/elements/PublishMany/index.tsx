'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { PublishManyDrawerContent } from './DrawerContent.js'

export type PublishManyProps = {
  collection: ClientCollectionConfig
}

export const PublishMany: React.FC<PublishManyProps> = (props) => {
  const { count, selectAll, selectedIDs, toggleAll } = useSelection()

  return (
    <PublishMany_v4
      {...props}
      count={count}
      ids={selectedIDs}
      onSuccess={() => toggleAll()}
      selectAll={selectAll === SelectAllStatus.AllAvailable}
    />
  )
}

type PublishMany_v4Props = {
  count: number
  ids: (number | string)[]
  /**
   * When multiple PublishMany components are rendered on the page, this will differentiate them.
   */
  modalPrefix?: string
  onModalOpen?: () => void
  onSuccess?: () => void
  selectAll: boolean
} & PublishManyProps

export const PublishMany_v4: React.FC<PublishMany_v4Props> = (props) => {
  const {
    collection,
    collection: { slug, versions } = {},
    count,
    ids,
    modalPrefix,
    onModalOpen,
    onSuccess,
    selectAll,
  } = props

  const { permissions } = useAuth()
  const { t } = useTranslation()

  const { isModalOpen, openModal } = useModal()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update

  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}publish-${slug}`

  const isOpen = isModalOpen(drawerSlug)

  useEffect(() => {
    if (isOpen) {
      if (typeof onModalOpen === 'function') {
        onModalOpen()
      }
    }
  }, [isOpen, onModalOpen])

  if (!versions?.drafts || count === 0 || !hasPermission) {
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
        ids={ids}
        onSuccess={onSuccess}
        selectAll={selectAll}
      />
    </React.Fragment>
  )
}
