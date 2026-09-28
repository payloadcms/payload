'use client'

import { validateMimeType } from 'payload/shared'
import React from 'react'
import { toast } from 'sonner'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { Dropzone } from '../../elements/Dropzone/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

type Props = {
  collectionSlug: string
  mimeTypes?: string[]
}

export function UploadDropzoneWidgetClient({ collectionSlug, mimeTypes }: Props) {
  const { modalSlug, setCollectionSlug, setInitialFiles } = useBulkUpload()
  const { openModal } = useModal()
  const { t } = useTranslation()

  const openUpload = React.useCallback(
    (files?: FileList) => {
      setCollectionSlug(collectionSlug)
      setInitialFiles(files)
      openModal(modalSlug)
    },
    [collectionSlug, modalSlug, openModal, setCollectionSlug, setInitialFiles],
  )

  const onDrop = React.useCallback(
    (files: FileList) => {
      const acceptedFiles = new DataTransfer()

      for (const file of files) {
        if (!mimeTypes?.length || validateMimeType(file.type, mimeTypes)) {
          acceptedFiles.items.add(file)
        }
      }

      if (!acceptedFiles.files.length) {
        toast.error(t('error:invalidFileType'))
        return
      }

      openUpload(acceptedFiles.files)
    },
    [mimeTypes, openUpload, t],
  )

  return (
    <Dropzone className="upload-dropzone-widget__dropzone" multipleFiles onChange={onDrop}>
      <div className="upload-dropzone-widget__content">
        <span aria-hidden="true" className="upload-dropzone-widget__icon" />
        <p className="upload-dropzone-widget__description">
          {t('dashboard:widgetUploadDropzoneDescription')}
        </p>
        <Button buttonStyle="secondary" onClick={() => openUpload()} size="medium">
          {t('dashboard:widgetUploadFiles')}
        </Button>
      </div>
      <p className="upload-dropzone-widget__drag-message">
        {t('dashboard:widgetDropFilesToUpload')}
      </p>
    </Dropzone>
  )
}
