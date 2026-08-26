'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const AudioFilePreviewClient: React.FC<UploadFilePreviewClientProps> = ({ fileSrc }) => {
  return (
    <div id="custom-file-preview-audio">
      {/* `controls` gives the audio element a visible bounding box; without it the element is 0×0
          and the wrapper is treated as hidden. Mirrors the built-in AudioPreview. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- user-uploaded media, captions unknown */}
      {fileSrc && <audio aria-label="audio preview" controls src={fileSrc} />}
    </div>
  )
}
