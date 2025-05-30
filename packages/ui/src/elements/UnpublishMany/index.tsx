'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { UnpublishManyDrawerContent } from './DrawerContent.js'

export type UnpublishManyProps = {
  collection: ClientCollectionConfig
}

export const UnpublishMany: React.FC<UnpublishManyProps> = (props) => {
  const { count, selectAll, selected } = useSelection()

  return (
    <UnpublishMany_v4
      {...props}
      count={count}
      ids={Array.from(selected.keys())}
      selectAll={selectAll === SelectAllStatus.AllAvailable}
    />
  )
}

export const UnpublishMany_v4: React.FC<
  {
    count: number
    ids: (number | string)[]
    selectAll: boolean
  } & UnpublishManyProps
> = (props) => {
  const { collection, collection: { slug, versions } = {}, count, ids, selectAll } = props

  const { t } = useTranslation()
  const { permissions } = useAuth()
  const { toggleModal } = useModal()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update

  const drawerSlug = `unpublish-${slug}`

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
        selectAll={selectAll}
      />
    </React.Fragment>
  )
}
