import React from 'react'

import serializeSlate from './serializeSlate'
import serializeLexical from './serializeLexical'

import classes from './index.module.scss'

export type RichTextProps = {
  className?: string
  content: any
  renderUploadFilenameOnly?: boolean
  serializer?: 'lexical' | 'slate'
}

const RichText = ({
  className,
  content,
  renderUploadFilenameOnly,
  serializer = 'slate',
}: RichTextProps) => {
  if (!content) {
    return null
  }

  return (
    <div className={[classes.richText, className].filter(Boolean).join(' ')}>
      {serializer === 'slate'
        ? serializeSlate(content, renderUploadFilenameOnly)
        : serializeLexical(content, renderUploadFilenameOnly)}
    </div>
  )
}

export default RichText
