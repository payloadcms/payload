import React from 'react'

import classes from './index.module.scss'
import serializeLexical from './serializeLexical.js'
import serializeSlate from './serializeSlate.js'

const RichText: React.FC<{
  className?: string
  content: any
  renderUploadFilenameOnly?: boolean
  serializer?: 'lexical' | 'slate'
}> = ({ className, content, renderUploadFilenameOnly, serializer = 'slate' }) => {
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
