import React from 'react'

import classes from './index.module.scss'
import serializeLexical from './serializeLexical.js'

const RichText: React.FC<{
  className?: string
  content: any
  renderUploadFilenameOnly?: boolean
}> = ({ className, content, renderUploadFilenameOnly }) => {
  if (!content) {
    return null
  }

  return (
    <div className={[classes.richText, className].filter(Boolean).join(' ')}>
      {serializeLexical(content, renderUploadFilenameOnly)}
    </div>
  )
}
export default RichText
