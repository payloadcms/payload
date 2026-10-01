import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

import { AudioFilePreviewClient } from './index.client.js'

export const AudioFilePreviewRSC: React.FC<UploadFilePreviewClientProps> = ({
  filename,
  filesize,
  fileSrc,
  height,
  mimeType,
  width,
}) => {
  return (
    <AudioFilePreviewClient
      filename={filename}
      filesize={filesize}
      fileSrc={fileSrc}
      height={height}
      mimeType={mimeType}
      width={width}
    />
  )
}
