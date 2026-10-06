'use client'

import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'upload-dropzone-content'

export type UploadDropzoneContentProps = {
  readonly acceptMimeTypes?: string
  readonly className?: string
  /** Extra controls rendered alongside the select/paste buttons, e.g. the single-upload field's custom `UploadControls`. */
  readonly extraControls?: React.ReactNode
  /** Allows selecting more than one file at once, used by the bulk upload drawer. */
  readonly multiple?: boolean
  readonly onFilesSelected: (files: FileList) => void
  readonly onPasteFromClipboard: () => void
  /** Additional className kept on the paste button for callers with existing selectors depending on it. */
  readonly pasteButtonClassName?: string
  readonly pasteTooltip: string
}

export function UploadDropzoneContent({
  acceptMimeTypes,
  className,
  extraControls,
  multiple,
  onFilesSelected,
  onPasteFromClipboard,
  pasteButtonClassName,
  pasteTooltip,
}: UploadDropzoneContentProps) {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__buttons`}>
        <Button buttonStyle="secondary" onClick={() => inputRef.current?.click()} size="medium">
          {t('upload:selectFile')}
        </Button>
        <input
          accept={acceptMimeTypes}
          aria-hidden="true"
          className={`${baseClass}__hidden-input`}
          hidden
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesSelected(e.target.files)
            }
          }}
          ref={inputRef}
          type="file"
        />
        <span className={`${baseClass}__or-text`}>{t('general:or')}</span>
        <Button
          buttonStyle="secondary"
          className={[`${baseClass}__pasteFromClipboard`, pasteButtonClassName]
            .filter(Boolean)
            .join(' ')}
          icon="clipboard"
          onClick={onPasteFromClipboard}
          size="medium"
          tooltip={pasteTooltip}
        />
        {extraControls}
      </div>
      <p className={`${baseClass}__drag-text`}>
        {t('general:or')} {t('upload:dragAndDrop')}
      </p>
    </div>
  )
}
