'use client'

import { validateMimeType } from 'payload/shared'

import { useConfig } from '../../providers/Config/index.js'
import { useFormsManager } from './FormsManager/index.js'
import { useBulkUpload } from './index.js'

export function useCompatibleSelectableCollections() {
  const { forms, isInitializing } = useFormsManager()
  const { initialFiles, initialForms, selectableCollections } = useBulkUpload()
  const { getEntityConfig } = useConfig()

  const files = forms.length
    ? forms
        .map(({ formState }) => formState?.file?.value)
        .filter((file): file is File => file instanceof File)
    : isInitializing
      ? initialFiles
        ? Array.from(initialFiles)
        : initialForms?.map(({ file }) => file) || []
      : []

  return selectableCollections?.filter((slug) => {
    const mimeTypes = getEntityConfig({ collectionSlug: slug })?.upload?.mimeTypes

    return files.every((file) => !mimeTypes?.length || validateMimeType(file.type, mimeTypes))
  })
}
