'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const AudioFilePreviewClient: React.FC<UploadFilePreviewClientProps> = ({ fileSrc }) => {
  return <div id="custom-file-preview-audio">test{fileSrc && <audio src={fileSrc} />}</div>
}
