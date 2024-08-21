'use client'

import React from 'react'

import { Dropzone } from '../../Dropzone/index.js'
import { DrawerHeader } from '../Header/index.js'
import { strings } from '../strings.js'
import './index.scss'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly onCancel: () => void
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ onCancel, onDrop }: Props) {
  return (
    <div className={baseClass}>
      <DrawerHeader onClose={onCancel} title={strings.addFiles} />
      <div className={`${baseClass}__dropArea`}>
        <Dropzone multipleFiles onChange={onDrop} />
      </div>
    </div>
  )
}
