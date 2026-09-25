'use client'
import { useModal } from '@faceless-ui/modal'
import { validateMimeType } from 'payload/shared'
import React from 'react'
import { toast } from 'sonner'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { Dropzone } from '../../elements/Dropzone/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { WidgetIcon } from '../WidgetIcon/index.js'
import './index.css'

export const UploadDropzoneWidgetClient = ({
  collectionSlug,
  mimeTypes,
}: {
  collectionSlug: string
  mimeTypes?: string[]
}) => {
  const {
    modalSlug,
    setCollectionSlug,
    setInitialFiles,
    setInitialForms,
    setMaxFiles,
    setOnCancel,
    setOnSuccess,
    setParentID,
    setSelectableCollections,
  } = useBulkUpload()
  const { openModal } = useModal()
  const { t } = useTranslation()
  const router = useRouter()
  const openUpload = ({ files }: { files?: FileList } = {}) => {
    if (
      files &&
      mimeTypes?.length &&
      Array.from(files).some((file) => !validateMimeType(file.type, mimeTypes))
    ) {
      toast.error(t('error:invalidFileType'))
      return
    }
    setCollectionSlug(collectionSlug)
    setInitialFiles(files)
    setInitialForms(undefined)
    setParentID(undefined)
    setMaxFiles(undefined)
    setSelectableCollections(null)
    setOnCancel(() => {})
    setOnSuccess(() => router.refresh())
    openModal(modalSlug)
  }
  return (
    <section aria-label={t('dashboard:uploadDropzone')} className="upload-dropzone-widget">
      <Dropzone
        className="upload-dropzone-widget__zone"
        multipleFiles
        onChange={(files) => openUpload({ files })}
      >
        <span className="upload-dropzone-widget__icon">
          <WidgetIcon name="images" />
        </span>
        <p className="upload-dropzone-widget__prompt">{t('dashboard:uploadHint')}</p>
        <p className="upload-dropzone-widget__drag">{t('dashboard:dropFiles')}</p>
        <Button buttonStyle="secondary" onClick={() => openUpload()} size="medium">
          {t('dashboard:uploadFiles')}
        </Button>
      </Dropzone>
    </section>
  )
}
