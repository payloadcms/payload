'use client'
import type { ClientCollectionConfig, Where } from '@ruya.sa/payload'

import { useModal } from '@faceless-ui/modal'
import React, { useState } from 'react'

import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js'

import { useAuth } from '../../providers/Auth/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer } from '../Drawer/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { EditManyDrawerContent } from './DrawerContent.js'
import './index.scss'

export const baseClass = 'edit-many'

export type EditManyProps = {
  readonly collection: ClientCollectionConfig
}

export const EditMany: React.FC<EditManyProps> = (props) => {
  const { count, selectAll, selectedIDs, toggleAll } = useSelection()

  return (
    <EditMany_v4
      {...props}
      count={count}
      ids={selectedIDs}
      onSuccess={() => toggleAll()}
      selectAll={selectAll === SelectAllStatus.AllAvailable}
    />
  )
}

export const EditMany_v4: React.FC<
  {
    count: number
    ids: (number | string)[]
    /**
     * When multiple EditMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string
    onSuccess?: () => void
    selectAll: boolean
    where?: Where
  } & Omit<EditManyProps, 'ids'>
> = ({ collection, count, ids, modalPrefix, onSuccess, selectAll, where }) => {
  const { permissions } = useAuth()
  const { openModal } = useModal()

  const { t } = useTranslation()

  const [selectedFields, setSelectedFields] = useState<FieldOption[]>([])

  const collectionPermissions = permissions?.collections?.[collection.slug]

  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}edit-${collection.slug}`

  if (count === 0 || !collectionPermissions?.update) {
    return null
  }

  return (
    <div className={[baseClass, `${baseClass}__toggle`].filter(Boolean).join(' ')}>
      <ListSelectionButton
        aria-label={t('general:edit')}
        onClick={() => {
          openModal(drawerSlug)
          setSelectedFields([])
        }}
      >
        {t('general:edit')}
      </ListSelectionButton>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <EditManyDrawerContent
            collection={collection}
            count={count}
            drawerSlug={drawerSlug}
            ids={ids}
            onSuccess={onSuccess}
            selectAll={selectAll}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
            where={where}
          />
        </Drawer>
      </EditDepthProvider>
    </div>
  )
}
