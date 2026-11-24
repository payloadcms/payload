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
 * Lets users drop files on the items of an upload collection's list view to open bulk upload with those files.
 * The "Bulk Upload" button in the list header stays the keyboard-accessible way to do the same thing.
 */
export function ListFileDropzone({
  children,
  collectionConfig,
  isEnabled,
}: {
  children: React.ReactNode
  collectionConfig: ClientCollectionConfig
  /**
   * When false, renders the children without a drop target.
   */
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
