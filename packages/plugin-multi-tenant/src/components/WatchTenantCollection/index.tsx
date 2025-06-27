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
  const addedNewTenant = React.useRef(false)

  const { getEntityConfig } = useConfig()
  const [useAsTitleName] = React.useState(
    () => (getEntityConfig({ collectionSlug }) as ClientCollectionConfig).admin.useAsTitle,
  )
  const titleField = useFormFields(([fields]) => (useAsTitleName ? fields[useAsTitleName] : {}))

  const { options, updateTenants } = useTenantSelection()

  const syncTenantTitle = useEffectEvent(() => {
    if (id) {
      updateTenants({ id, label: title })
    }
  })

  React.useEffect(() => {
    if (!id || !title || addedNewTenant.current) {
      return
    }
    // Track tenant creation and add it to the tenant selector
    const exists = options.some((opt) => opt.value === id)
    if (!exists) {
      addedNewTenant.current = true
      updateTenants({ id, label: title })
    }
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  React.useEffect(() => {
    // only update the tenant selector when the document saves
    // → aka when initial value changes
    if (id && titleField?.initialValue) {
      syncTenantTitle()
    }
  }, [id, titleField?.initialValue])

  return null
}
