'use client'

import { useDocumentEvents, useDocumentInfo, useUploadEdits } from '@payloadcms/ui'

export const DocumentInfoData = () => {
  const { data, docPermissions, unpublishedVersionCount } = useDocumentInfo()
  const { uploadEdits } = useUploadEdits()
  const { mostRecentUpdate } = useDocumentEvents()

  return (
    <span
      data-document-data={JSON.stringify(data)}
      data-document-events={JSON.stringify(mostRecentUpdate)}
      data-document-permissions={JSON.stringify(docPermissions)}
      data-upload-edits={JSON.stringify(uploadEdits)}
      data-version-count={unpublishedVersionCount}
      id="document-info-state"
    />
  )
}
