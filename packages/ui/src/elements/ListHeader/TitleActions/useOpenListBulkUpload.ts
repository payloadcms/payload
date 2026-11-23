'use client'
import type { CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useBulkUpload } from '../../BulkUpload/index.js'

/**
 * Returns a function that opens the bulk upload modal for a list view.
 * New documents go into the current hierarchy parent, and the list refreshes after a successful upload.
 */
export function useOpenListBulkUpload({
  collectionSlug,
  onBulkUploadSuccess,
}: {
  collectionSlug: CollectionSlug
  onBulkUploadSuccess?: () => void
}): (args?: { files?: FileList }) => void {
  const {
    modalSlug: bulkUploadModalSlug,
    setCollectionSlug,
    setInitialFiles,
    setOnSuccess,
    setParentID,
  } = useBulkUpload()
  const { parent } = useHierarchy()
  const { openModal } = useModal()
  const router = useRouter()

  return React.useCallback(
    ({ files }: { files?: FileList } = {}) => {
      setCollectionSlug(collectionSlug)
      setParentID(parent?.id)
      setInitialFiles(files)
      openModal(bulkUploadModalSlug)
      setOnSuccess(() => {
        if (typeof onBulkUploadSuccess === 'function') {
          onBulkUploadSuccess()
        } else {
          router.refresh()
        }
      })
    },
    [
      router,
      collectionSlug,
      bulkUploadModalSlug,
      parent,
      openModal,
      setCollectionSlug,
      setInitialFiles,
      setParentID,
      setOnSuccess,
      onBulkUploadSuccess,
    ],
  )
}
