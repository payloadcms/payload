'use client'
import type { ClientCollectionConfig } from 'payload'

import React from 'react'
import { toast } from 'sonner'

import { useOpenListBulkUpload } from '../../../elements/BulkUpload/useOpenListBulkUpload.js'
import { Dropzone } from '../../../elements/Dropzone/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { isFileTypeAccepted } from '../../../utilities/isFileTypeAccepted.js'
import './index.css'

const baseClass = 'list-file-dropzone'

/**
 * Keyboard users open bulk upload with the "Bulk Upload" button in the list header instead.
 */
export function ListFileDropzone({
  children,
  collectionConfig,
  isEnabled,
}: {
  children: React.ReactNode
  collectionConfig: ClientCollectionConfig
  isEnabled: boolean
}) {
  const { t } = useTranslation()
  const openBulkUpload = useOpenListBulkUpload({ collectionSlug: collectionConfig.slug })
  const mimeTypes = collectionConfig.upload?.mimeTypes

  const onDrop = React.useCallback(
    (files: FileList) => {
      const hasAcceptedFile = Array.from(files).some((file) =>
        isFileTypeAccepted({ file, mimeTypes }),
      )

      if (!hasAcceptedFile) {
        toast.error(t('error:invalidFileType'))
        return
      }

      openBulkUpload({ files })
    },
    [mimeTypes, openBulkUpload, t],
  )

  if (!isEnabled) {
    return children
  }

  return (
    <Dropzone
      className={baseClass}
      dropzoneStyle="outline"
      isPasteEnabled={false}
      multipleFiles
      onChange={onDrop}
    >
      {children}
      <div className={`${baseClass}__message-anchor`}>
        <p className={`${baseClass}__message`}>{t('upload:dragAndDrop')}</p>
      </div>
    </Dropzone>
  )
}
