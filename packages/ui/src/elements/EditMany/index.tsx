'use client'
import type { ClientCollectionConfig, FieldWithPathClient } from 'payload'

import React, { useState } from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { EditManyDrawerContent } from './DrawerContent.js'

export const baseClass = 'edit-many'

export type EditManyProps = {
  readonly collection: ClientCollectionConfig
}

export const EditMany: React.FC<EditManyProps> = (props) => {
  const {
    collection: { slug },
  } = props

  const { permissions } = useAuth()

  const { selectAll } = useSelection()
  const { t } = useTranslation()
  const [selected, setSelected] = useState<FieldWithPathClient[]>([])

  const collectionPermissions = permissions?.collections?.[slug]
  const hasUpdatePermission = collectionPermissions?.update

  const drawerSlug = `edit-${slug}`

  if (selectAll === SelectAllStatus.None || !hasUpdatePermission) {
    return null
  }

  return (
    <div className={baseClass}>
      <DrawerToggler
        aria-label={t('general:edit')}
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSelected([])
        }}
        slug={drawerSlug}
      >
        {t('general:edit')}
      </DrawerToggler>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <EditManyDrawerContent
            collection={props.collection}
            drawerSlug={drawerSlug}
            selected={selected}
          />
        </Drawer>
      </EditDepthProvider>
    </div>
  )
}
