'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const FilePreviewComponent: React.FC<UploadFilePreviewClientProps> = ({
  filename,
  fileSrc,
  mimeType,
}) => {
  const [category] = (mimeType ?? '').split('/')

  switch (category) {
    case 'audio':
      return (
        <div data-mime-category="audio" id="file-preview">
          <audio controls src={fileSrc ?? undefined} />
        </div>
      )
    case 'image':
      return (
        <div data-mime-category="image" id="file-preview">
          <img
            alt={filename}
            src={fileSrc ?? undefined}
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>
      )
    case 'video':
      return (
        <div data-mime-category="video" id="file-preview">
          <video controls src={fileSrc ?? undefined} style={{ maxWidth: '100%' }} />
        </div>
      )
    default:
      return (
        <div data-mime-category="other" id="file-preview">
          {fileSrc ? <a href={fileSrc}>{filename}</a> : filename}
        </div>
      )
  }
}
