'use client'
import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

export const PdfFilePreviewClient: React.FC<UploadFilePreviewClientProps> = ({ fileSrc }) => {
  return <div id="custom-file-preview-pdf">{fileSrc && <span>{fileSrc}</span>}</div>
}
