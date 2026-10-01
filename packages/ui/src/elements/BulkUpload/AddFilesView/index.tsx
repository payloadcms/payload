'use client'

import React from 'react'
import { toast } from 'sonner'

import { useTranslation } from '../../../providers/Translation/index.js'
import { getFilesFromClipboard } from '../../../utilities/getFilesFromClipboard.js'
import { DialogHeader, DialogModal } from '../../Dialog/index.js'
import { Dropzone } from '../../Dropzone/index.js'
import { UploadDropzoneContent } from '../../UploadDropzoneContent/index.js'
import './index.css'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly acceptMimeTypes?: string
  readonly modalSlug: string
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ acceptMimeTypes, modalSlug: modalSlug, onDrop }: Props) {
  const { t } = useTranslation()

  const handlePasteFromClipboard = React.useCallback(async () => {
    try {
      const files = await getFilesFromClipboard()
      if (!files) {
        toast.error(t('error:noFileFoundInClipboard'))
        return
      }
      onDrop(files)
    } catch (_err) {
      toast.error(t('error:unableToReadClipboard'))
    }
  }, [onDrop, t])

  return (
    <DialogModal className={baseClass} size="large" slug={modalSlug}>
      <DialogHeader showClose title={t('upload:addFiles')} />
      <div className={`${baseClass}__body`}>
        <div className={`${baseClass}__dropArea`}>
          <Dropzone multipleFiles onChange={onDrop}>
            <UploadDropzoneContent
              acceptMimeTypes={acceptMimeTypes}
              className={`${baseClass}__dropzoneContent`}
              multiple
              onFilesSelected={onDrop}
              onPasteFromClipboard={handlePasteFromClipboard}
              pasteButtonClassName={`${baseClass}__pasteFromClipboard`}
              pasteTooltip={t('upload:pasteFromClipboard')}
            />
          </Dropzone>
        </div>
      </div>
    </DialogModal>
  )
}
