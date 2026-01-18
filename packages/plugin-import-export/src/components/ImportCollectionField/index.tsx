'use client'
import type { SelectFieldClientComponent } from '@ruya.sa/payload'

import { SelectField, useDocumentInfo } from '@ruya.sa/ui'

export const ImportCollectionField: SelectFieldClientComponent = (props) => {
  const { id, initialData } = useDocumentInfo()

  // If creating (no id) and have initialData with collectionSlug (e.g., from drawer),
  // hide the field to prevent user selection.
  if (!id && initialData?.collectionSlug) {
    return null
  }

  // Otherwise render the normal select field
  return <SelectField {...props} />
}
