import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

import { PdfFilePreviewClient } from './index.client.js'

export const PdfFilePreviewRSC: React.FC<UploadFilePreviewClientProps> = ({
  filename,
  filesize,
  fileSrc,
  height,
  mimeType,
  width,
}) => {
  return (
    <PdfFilePreviewClient
      filename={filename}
      filesize={filesize}
      fileSrc={fileSrc}
      height={height}
      mimeType={mimeType}
      width={width}
    />
  )
}
