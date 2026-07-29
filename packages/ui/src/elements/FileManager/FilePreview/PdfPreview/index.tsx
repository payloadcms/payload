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
  // Deliberately no `sandbox` attribute: Chromium disables its built-in PDF viewer inside
  // sandboxed iframes (regardless of which tokens are allowed), so any sandbox value breaks the
  // preview entirely. The file is served same-origin with an `application/pdf` content type, which
  // the browser renders as a PDF document rather than as executable HTML.
  // eslint-disable-next-line @eslint-react/dom/no-missing-iframe-sandbox -- sandboxing disables Chromium's PDF viewer; same-origin application/pdf is rendered as a document, not HTML
  return <iframe className={baseClass} src={fileSrc} title={title ?? 'PDF preview'} />
}
