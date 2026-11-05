'use client'
import React from 'react'

import './index.css'

const baseClass = 'audio-preview'

/**
 * Built-in preview for native audio files, rendered inside the file manager when the
 * uploaded file's mime type is `audio/*` and no custom file preview is provided.
 */
export const AudioPreview: React.FC<{ fileSrc: string }> = ({ fileSrc }) => {
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption -- user-uploaded media, captions unknown
    <audio className={baseClass} controls src={fileSrc} />
  )
}
