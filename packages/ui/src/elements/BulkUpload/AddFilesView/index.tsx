'use client'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { Dropzone } from '../../Dropzone/index.js'
import { DrawerHeader } from '../Header/index.js'
import './index.scss'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly acceptMimeTypes?: string
  readonly onCancel: () => void
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ acceptMimeTypes, onCancel, onDrop }: Props) {
  const { t } = useTranslation()

  const inputRef = React.useRef(null)

  return (
    <div className={baseClass}>
      <DrawerHeader onClose={onCancel} title={t('upload:addFiles')} />
      <div className={`${baseClass}__dropArea`}>
        <Dropzone multipleFiles onChange={onDrop}>
          <Button
            buttonStyle="pill"
            iconPosition="left"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.click()
              }
            }}
            size="small"
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
  )
}
