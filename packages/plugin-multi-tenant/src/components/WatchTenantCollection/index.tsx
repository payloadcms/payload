'use client'

import type { ClientCollectionConfig } from 'payload'

import {
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useEffectEvent,
  useFormFields,
} from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

export const WatchTenantCollection = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { title } = useDocumentTitle()

  const { getEntityConfig } = useConfig()
  const [useAsTitleName] = React.useState(
    () => (getEntityConfig({ collectionSlug }) as ClientCollectionConfig).admin.useAsTitle,
  )
  const titleField = useFormFields(([fields]) => fields[useAsTitleName])

  const { updateTenants } = useTenantSelection()

  const syncTenantTitle = useEffectEvent(() => {
    if (id) {
      updateTenants({ id, label: title })
    }
  })

  React.useEffect(() => {
    // only update the tenant selector when the document saves
    // → aka when initial value changes
    if (id && titleField?.initialValue) {
      syncTenantTitle()
    }
  }, [id, titleField?.initialValue])

  return null
}
