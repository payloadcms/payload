import React from 'react'

import { Dropzone } from '../../Dropzone/index.js'
import { DrawerHeader } from '../Header/index.js'
import './index.scss'

const baseClass = 'bulk-upload--add-files'

type Props = {
  readonly onDrop: (acceptedFiles: FileList) => void
}
export function AddFilesView({ onDrop }: Props) {
  return (
    <div className={baseClass}>
      <DrawerHeader title="Add Files" />
      <div className={`${baseClass}__dropArea`}>
        <Dropzone multipleFiles onChange={onDrop} />
      </div>
    </div>
  )
}
