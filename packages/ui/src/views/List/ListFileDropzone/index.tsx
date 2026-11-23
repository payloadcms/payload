'use client'
import type { ClientCollectionConfig } from 'payload'

import { validateMimeType } from 'payload/shared'
import React from 'react'
import { toast } from 'sonner'

import { Dropzone } from '../../../elements/Dropzone/index.js'
import { useOpenListBulkUpload } from '../../../elements/ListHeader/TitleActions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
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
      const hasAcceptedFile = Array.from(files).some(
        (file) => !mimeTypes?.length || validateMimeType(file.type, mimeTypes),
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
      isFocusable={false}
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
