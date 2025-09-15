import React from 'react'

import classes from './index.module.scss'
import serializeLexical from './serializeLexical.js'
import serializeSlate from './serializeSlate.js'

const RichText: React.FC<{
  className?: string
  content: any
  renderUploadFilenameOnly?: boolean
}> = ({ className, content, renderUploadFilenameOnly }) => {
  if (!content) {
    return null
  }

  const serializer = Array.isArray(content) ? 'slate' : 'lexical'
  return (
    <div className={[classes.richText, className].filter(Boolean).join(' ')}>
      {serializer === 'slate'
        ? serializeSlate(content, renderUploadFilenameOnly)
        : serializeLexical(content, renderUploadFilenameOnly)}
    </div>
  )
}

export default RichText
