'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const AudioFilePreviewClient: React.FC<UploadFilePreviewClientProps> = ({ fileSrc }) => {
  return (
    <div id="custom-file-preview-audio">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- user-uploaded media, captions unknown */}
      {fileSrc && <audio src={fileSrc} />}
    </div>
  )
}
