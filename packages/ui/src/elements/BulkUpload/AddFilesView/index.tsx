'use client'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Dropzone } from '../../Dropzone/index.js'
import { DrawerHeader } from '../Header/index.js'
import './index.scss'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly drawerSlug: string
  readonly onCancel: () => void
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ drawerSlug, onCancel, onDrop }: Props) {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <DrawerHeader onClose={onCancel} slug={drawerSlug} title={t('upload:addFiles')} />
      <div className={`${baseClass}__dropArea`}>
        <Dropzone multipleFiles onChange={onDrop} />
      </div>
    </div>
  )
}
