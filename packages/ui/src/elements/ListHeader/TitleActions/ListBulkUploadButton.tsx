'use client'
import type { CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { useBulkUpload } from '../../../elements/BulkUpload/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'

export function ListBulkUploadButton({
  collectionSlug,
  hasCreatePermission,
  isBulkUploadEnabled,
  onBulkUploadSuccess,
  openBulkUpload: openBulkUploadFromProps,
}: {
  collectionSlug: CollectionSlug
  hasCreatePermission: boolean
  isBulkUploadEnabled: boolean
  onBulkUploadSuccess?: () => void
  /**
   * @deprecated This prop will be removed in the next major version.
   *
   * Prefer using `onBulkUploadSuccess`
   */
  openBulkUpload?: () => void
}) {
  const {
    drawerSlug: bulkUploadDrawerSlug,
    setCollectionSlug,
    setCurrentActivePath,
    setOnSuccess,
  } = useBulkUpload()
  const { t } = useTranslation()
  const { openModal } = useModal()
  const router = useRouter()

  const openBulkUpload = React.useCallback(() => {
    if (typeof openBulkUploadFromProps === 'function') {
      openBulkUploadFromProps()
    } else {
      setCollectionSlug(collectionSlug)
      setCurrentActivePath(collectionSlug)
      openModal(bulkUploadDrawerSlug)
      setOnSuccess(collectionSlug, () => {
        if (typeof onBulkUploadSuccess === 'function') {
          onBulkUploadSuccess()
        } else {
          router.refresh()
        }
      })
    }
  }, [
    router,
    collectionSlug,
    bulkUploadDrawerSlug,
    openModal,
    setCollectionSlug,
    setCurrentActivePath,
    setOnSuccess,
    onBulkUploadSuccess,
    openBulkUploadFromProps,
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
      size="small"
    >
      {t('upload:bulkUpload')}
    </Button>
  )
}
