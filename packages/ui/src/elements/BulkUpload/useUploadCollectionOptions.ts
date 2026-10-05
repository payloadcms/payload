'use client'

import { getTranslation } from '@payloadcms/translations'
import { validateMimeType } from 'payload/shared'
import { useMemo } from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useFormsManager } from './FormsManager/index.js'
import { useBulkUpload } from './index.js'

export function useUploadCollectionOptions() {
  const { forms, isInitializing } = useFormsManager()
  const { initialFiles, initialForms, selectableCollections } = useBulkUpload()
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  return useMemo(() => {
    const files = forms.length
      ? forms
          .map(({ formState }) => formState?.file?.value)
          .filter((file): file is File => file instanceof File)
      : isInitializing
        ? initialFiles
          ? Array.from(initialFiles)
          : initialForms?.map(({ file }) => file) || []
        : []

    return (selectableCollections ?? []).map((slug) => {
      const config = getEntityConfig({ collectionSlug: slug })
      const mimeTypes = config.upload?.mimeTypes
      const isCompatible = files.every(
        (file) => !mimeTypes?.length || validateMimeType(file.type, mimeTypes),
      )
      const label = getTranslation(config.labels.singular, i18n)

      return {
        isDisabled: !isCompatible,
        label: isCompatible
          ? label
          : `${label} (${t('general:accepts')}: ${mimeTypes?.join(', ')})`,
        value: slug,
      }
    })
  }, [
    forms,
    getEntityConfig,
    i18n,
    initialFiles,
    initialForms,
    isInitializing,
    selectableCollections,
    t,
  ])
}
