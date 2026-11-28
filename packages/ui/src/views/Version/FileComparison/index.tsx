'use client'
import React from 'react'

import type { FileComparison, VersionFile } from './getFileComparison.js'

import { FieldDiffContainer } from '../../../elements/FieldDiffContainer/index.js'
import { FileMeta } from '../../../elements/FileDetails/FileMeta/index.js'
import { Thumbnail } from '../../../elements/Thumbnail/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'version-file-comparison'

export type VersionFileComparisonProps = {
  comparison: FileComparison
  /** False when the collection sets `upload.displayPreview: false`. */
  showPreview: boolean
}

export const VersionFileComparison: React.FC<VersionFileComparisonProps> = ({
  comparison: { fileFrom, fileTo, hasChanged },
  showPreview,
}) => {
  const { i18n, t } = useTranslation()

  return (
    <FieldDiffContainer
      className={baseClass}
      From={
        <VersionFileCard
          file={fileFrom}
          hasChanged={hasChanged}
          showPreview={showPreview}
          side="from"
        />
      }
      i18n={i18n}
      label={{ label: t('upload:file') }}
      To={
        <VersionFileCard
          file={fileTo}
          hasChanged={hasChanged}
          showPreview={showPreview}
          side="to"
        />
      }
    />
  )
}

const VersionFileCard: React.FC<{
  file: null | VersionFile
  hasChanged: boolean
  showPreview: boolean
  side: 'from' | 'to'
}> = ({ file, hasChanged, showPreview, side }) => {
  const fileClassNames = [`${baseClass}__file`, hasChanged && `${baseClass}__file--changed`]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`${baseClass}__side ${baseClass}__side--${side}`}>
      {file && (
        <div className={fileClassNames}>
          {showPreview && (
            <Thumbnail
              className={`${baseClass}__thumbnail`}
              doc={{ filename: file.filename }}
              fileSrc={file.previewSrc}
              size="medium"
            />
          )}
          <FileMeta
            filename={file.filename}
            filesize={file.filesize}
            height={file.height}
            mimeType={file.mimeType}
            url={file.url}
            width={file.width}
          />
        </div>
      )}
    </div>
  )
}
