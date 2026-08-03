'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const SingleFilePreviewClient: React.FC<UploadFilePreviewClientProps> = ({
  fileSrc,
  mimeType,
}) => {
  return (
    <div data-mime-type={mimeType} id="custom-file-preview-single">
      {fileSrc && <span>{fileSrc}</span>}
    </div>
  )
}
