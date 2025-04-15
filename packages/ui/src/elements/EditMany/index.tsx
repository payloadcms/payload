'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useState } from 'react'

import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js'

import { useAuth } from '../../providers/Auth/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer } from '../Drawer/index.js'
import { EditManyDrawerContent } from './DrawerContent.js'
import './index.scss'

export const baseClass = 'edit-many'

export type EditManyProps = {
  readonly collection: ClientCollectionConfig
}

export const EditMany: React.FC<EditManyProps> = (props) => {
  const {
    collection: { slug },
  } = props

  const { permissions } = useAuth()
  const { openModal } = useModal()

  const { selectAll } = useSelection()
  const { t } = useTranslation()

  const [selectedFields, setSelectedFields] = useState<FieldOption[]>([])

  const collectionPermissions = permissions?.collections?.[slug]

  const drawerSlug = `edit-${slug}`

  if (selectAll === SelectAllStatus.None || !collectionPermissions?.update) {
    return null
  }

  return (
    <div className={baseClass}>
      <button
        aria-label={t('general:edit')}
        className={`${baseClass}__toggle`}
        onClick={() => {
          openModal(drawerSlug)
          setSelectedFields([])
        }}
        type="button"
      >
        {t('general:edit')}
      </button>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <EditManyDrawerContent
            collection={props.collection}
            drawerSlug={drawerSlug}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
          />
        </Drawer>
      </EditDepthProvider>
    </div>
  )
}
