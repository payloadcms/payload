import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

import { SingleFilePreviewClient } from './index.client.js'

export const SingleFilePreviewRSC: React.FC<UploadFilePreviewClientProps> = ({
  filename,
  filesize,
  fileSrc,
  height,
  mimeType,
  width,
}) => {
  return (
    <SingleFilePreviewClient
      filename={filename}
      filesize={filesize}
      fileSrc={fileSrc}
      height={height}
      mimeType={mimeType}
      width={width}
    />
  )
}
