'use client'

import type { ClientCollectionConfig } from 'payload'

import {
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useEffectEvent,
  useFormFields,
  useFormSubmitted,
  useOperation,
} from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

export const WatchTenantCollection = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const operation = useOperation()
  const submitted = useFormSubmitted()
  const { title } = useDocumentTitle()

  const { getEntityConfig } = useConfig()
  const [useAsTitleName] = React.useState(
    () => (getEntityConfig({ collectionSlug }) as ClientCollectionConfig).admin.useAsTitle,
  )
  const titleField = useFormFields(([fields]) => (useAsTitleName ? fields[useAsTitleName] : {}))

  const { syncTenants, updateTenants } = useTenantSelection()

  const syncTenantTitle = useEffectEvent(() => {
    if (id) {
      updateTenants({ id, label: title })
    }
  })

  React.useEffect(() => {
    // only update the tenant selector when the document saves
    // → aka when initial value changes
    if (id && titleField?.initialValue) {
      void syncTenantTitle()
    }
  }, [id, titleField?.initialValue])

  React.useEffect(() => {
    if (operation === 'create' && submitted) {
      void syncTenants()
    }
  }, [operation, submitted, syncTenants, id])

  return null
}
