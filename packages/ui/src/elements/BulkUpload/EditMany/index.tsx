'use client'

import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { useAuth } from '../../../providers/Auth/index.js'
import { EditDepthProvider } from '../../../providers/EditDepth/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Drawer, DrawerToggler } from '../../Drawer/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { EditManyBulkUploadsDrawerContent } from './DrawerContent.js'
import './index.scss'

export const baseClass = 'edit-many-bulk-uploads'

export type EditManyBulkUploadsProps = {
  readonly collection: ClientCollectionConfig
}

export const EditManyBulkUploads: React.FC<EditManyBulkUploadsProps> = (props) => {
  const { collection: { slug } = {}, collection } = props

  const { permissions } = useAuth()

  const { t } = useTranslation()
  const { forms } = useFormsManager() // Access forms managed in bulk uploads

  const collectionPermissions = permissions?.collections?.[slug]
  const hasUpdatePermission = collectionPermissions?.update

  const drawerSlug = `edit-${slug}-bulk-uploads`

  if (!hasUpdatePermission) {
    return null
  }

  return (
    <div className={baseClass}>
      <DrawerToggler
        aria-label={t('general:editAll')}
        className={`${baseClass}__toggle`}
        slug={drawerSlug}
      >
        {t('general:editAll')}
      </DrawerToggler>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <EditManyBulkUploadsDrawerContent
            collection={collection}
            drawerSlug={drawerSlug}
            forms={forms}
          />
        </Drawer>
      </EditDepthProvider>
    </div>
  )
}
