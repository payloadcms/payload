'use client'

import { validateMimeType } from 'payload/shared'
import React from 'react'
import { toast } from 'sonner'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { Dropzone } from '../../elements/Dropzone/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { ImageStackIcon } from '../../icons/ImageStack/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

type Props = {
  collections: Array<{ mimeTypes?: string[]; slug: string }>
}

export function UploadDropzoneWidgetClient({ collections }: Props) {
  const { modalSlug, setCollectionSlug, setInitialFiles, setSelectableCollections } =
    useBulkUpload()
  const { openModal } = useModal()
  const { t } = useTranslation()

  const openUpload = React.useCallback(
    (files?: FileList, availableCollections = collections) => {
      setSelectableCollections(availableCollections.map(({ slug }) => slug))
      setCollectionSlug(availableCollections[0].slug)
      setInitialFiles(files)
      openModal(modalSlug)
    },
    [
      collections,
      modalSlug,
      openModal,
      setCollectionSlug,
      setInitialFiles,
      setSelectableCollections,
    ],
  )

  const onDrop = React.useCallback(
    (files: FileList) => {
      const compatibleCollections = collections.filter(({ mimeTypes }) =>
        Array.from(files).every(
          (file) => !mimeTypes?.length || validateMimeType(file.type, mimeTypes),
        ),
      )

      if (!compatibleCollections.length) {
        toast.error(t('error:invalidFileType'))
        return
      }

      openUpload(files, compatibleCollections)
    },
    [collections, openUpload, t],
  )

  return (
    <Dropzone
      className="upload-dropzone-widget__dropzone"
      isFocusable={false}
      multipleFiles
      onChange={onDrop}
    >
      <div className="upload-dropzone-widget__content">
        <span aria-hidden="true" className="upload-dropzone-widget__icon">
          <ImageStackIcon />
        </span>
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
