import React from 'react'

import serialize from './serialize'

import classes from './index.module.scss'

type RichTextProps = {
  className?: string
  content: any
}

function RichText({ className, content }: RichTextProps) {
  if (!content) {
    return null
  }

  return (
    <div className={[classes.richText, className].filter(Boolean).join(' ')}>
      {serialize(content)}
    </div>
  )
}

export default RichText
