import type { DefaultServerCellComponentProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component needs the client boundary for Link.
import { Link } from '../../exports/client/index.js'
import './index.css'

export const LLMInstructionsCell = ({
  cellData,
  field,
  link,
  linkURL,
}: DefaultServerCellComponentProps) => {
  const text =
    typeof cellData === 'string'
      ? cellData
      : cellData && field.type === 'richText' && typeof field.editor !== 'function'
        ? (field.editor?.converters?.toMarkdown?.({ data: cellData }) ?? '')
        : ''
  const preview = <span className="llm-instructions-cell">{text}</span>

  return link && linkURL ? <Link href={linkURL}>{preview}</Link> : preview
}
