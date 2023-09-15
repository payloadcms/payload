import React from 'react'

import { Drawer } from '../../../../../elements/Drawer'
import { Dropzone } from '../../../../../elements/Dropzone'
import './index.scss'

type Props = {
  onDrop: (e: FileList) => void
  slug: string
}

const addFilesDrawerBaseClass = 'add-files-drawer'
export const AddFilesDrawer: React.FC<Props> = ({ onDrop, slug }) => {
  return (
    <Drawer className={addFilesDrawerBaseClass} slug={slug} title="Add Files">
      <Dropzone
        className={`${addFilesDrawerBaseClass}__dropzone`}
        multipleFiles
        onChange={onDrop}
      />
    </Drawer>
  )
}
