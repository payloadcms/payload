'use client'
import type { CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useBulkUpload } from '../../../elements/BulkUpload/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
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
  const {
    modalSlug: bulkUploadModalSlug,
    setCollectionSlug,
    setOnSuccess,
    setParentID,
  } = useBulkUpload()
  const { parent } = useHierarchy()
  const { t } = useTranslation()
  const { openModal } = useModal()
  const router = useRouter()

  const openBulkUpload = React.useCallback(() => {
    setCollectionSlug(collectionSlug)
    setParentID(parent?.id)
    openModal(bulkUploadModalSlug)
    setOnSuccess(() => {
      if (typeof onBulkUploadSuccess === 'function') {
        onBulkUploadSuccess()
      } else {
        router.refresh()
      }
    })
  }, [
    router,
    collectionSlug,
    bulkUploadModalSlug,
    parent,
    openModal,
    setCollectionSlug,
    setParentID,
    setOnSuccess,
    onBulkUploadSuccess,
  ])

  if (!hasCreatePermission || !isBulkUploadEnabled) {
    return null
  }

  return (
    <Button
      aria-label={t('upload:bulkUpload')}
      buttonStyle="pill"
      key="bulk-upload-button"
      onClick={openBulkUpload}
      size="medium"
    >
      {t('upload:bulkUpload')}
    </Button>
  )
}
