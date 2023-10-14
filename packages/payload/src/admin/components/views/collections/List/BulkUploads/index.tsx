import { useModal } from '@faceless-ui/modal'
import * as React from 'react'

import type { SanitizedCollectionConfig } from '../../../../../../exports/types'

import Pill from '../../../../elements/Pill'
import { AddFilesDrawer } from './AddFilesDrawer'
import { ManageFilesDrawer, manageFilesDrawerSlug } from './ManageFilesDrawer'
import { BulkUploadFormDataProvider } from './Provider'
import './index.scss'

const baseClass = 'bulk-uploads'

const bulkAddFilesSlug = 'bulk-add-files'
type Props = {
  collection: SanitizedCollectionConfig
}
export const BulkUploads: React.FC<Props> = ({ collection }) => {
  const { openModal } = useModal()
  const [files, setFiles] = React.useState<FileList | null>(null)

  const onDrop = React.useCallback(
    (droppedFiles: FileList) => {
      setFiles(droppedFiles)
      openModal(manageFilesDrawerSlug)
    },
    [openModal],
  )

  return (
    <div className={baseClass}>
      <Pill onClick={() => openModal(bulkAddFilesSlug)}>Bulk Upload</Pill>

      {files && (
        <BulkUploadFormDataProvider initialFiles={files}>
          <ManageFilesDrawer collection={collection} initialFiles={files} />
        </BulkUploadFormDataProvider>
      )}

      <AddFilesDrawer onDrop={onDrop} slug={bulkAddFilesSlug} />
    </div>
  )
}
