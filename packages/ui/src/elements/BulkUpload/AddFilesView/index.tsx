'use client'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DialogHeader, DialogModal } from '../../Dialog/index.js'
import { Dropzone } from '../../Dropzone/index.js'
import './index.css'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly acceptMimeTypes?: string
  readonly modalSlug: string
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ acceptMimeTypes, modalSlug: modalSlug, onDrop }: Props) {
  const { t } = useTranslation()

  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DialogModal className={baseClass} size="large" slug={modalSlug}>
      <DialogHeader showClose title={t('upload:addFiles')} />
      <div className={`${baseClass}__body`}>
        <div className={`${baseClass}__dropArea`}>
          <Dropzone multipleFiles onChange={onDrop}>
            <Button
              buttonStyle="primary"
              iconPosition="left"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.click()
                }
              }}
              size="medium"
            >
              {t('upload:selectFile')}
            </Button>
            <input
              accept={acceptMimeTypes}
              aria-hidden="true"
              className={`${baseClass}__hidden-input`}
              hidden
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onDrop(e.target.files)
                }
              }}
              ref={inputRef}
              type="file"
            />

            <p className={`${baseClass}__dragAndDropText`}>
              {t('general:or')} {t('upload:dragAndDrop')}
            </p>
          </Dropzone>
        </div>
      </div>
    </DialogModal>
  )
}
