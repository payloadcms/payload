'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useState } from 'react'

import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js'

import { useAuth } from '../../providers/Auth/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer } from '../Drawer/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import { EditManyDrawerContent } from './DrawerContent.js'
import './index.css'

export const baseClass = 'edit-many'

export type EditManyProps = {
  readonly collection: ClientCollectionConfig
  readonly count: number
  readonly ids: (number | string)[]
  /**
   * When multiple EditMany components are rendered on the page, this will differentiate them.
   */
  readonly modalPrefix?: string
  readonly onSuccess?: () => void
  readonly selectAll: boolean
  readonly where?: Where
}

export const EditMany: React.FC<EditManyProps> = ({
  collection,
  count,
  ids,
  modalPrefix,
  onSuccess,
  selectAll,
  where,
}) => {
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
