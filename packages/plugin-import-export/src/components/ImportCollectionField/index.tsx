'use client'
import type { SelectFieldClientComponent } from 'payload'

import { SelectField, useDocumentInfo } from '@payloadcms/ui'

export const ImportCollectionField: SelectFieldClientComponent = (props) => {
  const { id, initialData } = useDocumentInfo()

  // If creating (no id) and have initialData with collectionSlug (e.g., from drawer),
  // hide the field to prevent user selection.
  const shouldHide = !id && initialData?.collectionSlug

  if (shouldHide) {
    return (
      <div style={{ display: 'none' }}>
        <SelectField {...props} />
      </div>
    )
  }

  // Otherwise render the normal select field
  return <SelectField {...props} />
}
