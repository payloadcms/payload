'use client'
import React from 'react'

import './index.css'

const baseClass = 'pdf-preview'

/**
 * Built-in preview for PDF files, rendered inside the file manager when the uploaded file's
 * mime type is `application/pdf` and no custom file preview is provided. Uses the browser's
 * native PDF viewer via an iframe.
 */
export const PdfPreview: React.FC<{ fileSrc: string; title?: string }> = ({ fileSrc, title }) => {
  return <iframe className={baseClass} src={fileSrc} title={title ?? 'PDF preview'} />
}
