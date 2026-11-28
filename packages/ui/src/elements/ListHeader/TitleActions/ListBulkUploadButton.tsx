'use client'
import type { CollectionSlug } from 'payload'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useOpenListBulkUpload } from '../../BulkUpload/useOpenListBulkUpload.js'
import { Button } from '../../Button/index.js'

export function ListBulkUploadButton({
  collectionSlug,
  hasCreatePermission,
  isBulkUploadEnabled,
  onBulkUploadSuccess,
}: {
  collectionSlug: CollectionSlug
  hasCreatePermission: boolean
  isBulkUploadEnabled: boolean
  onBulkUploadSuccess?: () => void
}) {
  const { t } = useTranslation()
  const openBulkUpload = useOpenListBulkUpload({ collectionSlug, onBulkUploadSuccess })

  if (!hasCreatePermission || !isBulkUploadEnabled) {
    return null
  }

  return (
    <Button
      aria-label={t('upload:bulkUpload')}
      buttonStyle="pill"
      key="bulk-upload-button"
      onClick={() => openBulkUpload()}
      size="medium"
    >
      {t('upload:bulkUpload')}
    </Button>
  )
}
