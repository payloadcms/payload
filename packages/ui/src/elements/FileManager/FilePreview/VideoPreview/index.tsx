'use client'
import React from 'react'

import './index.css'

const baseClass = 'video-preview'

/**
 * Built-in preview for native video files, rendered inside the file manager when the
 * uploaded file's mime type is `video/*` and no custom file preview is provided.
 */
export const VideoPreview: React.FC<{ fileSrc: string }> = ({ fileSrc }) => {
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption -- user-uploaded media, captions unknown
    <video className={baseClass} controls src={fileSrc} />
  )
}
