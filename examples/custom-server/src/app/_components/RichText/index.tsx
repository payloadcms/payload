'use client'

import React from 'react'

import { CustomRenderers, Serialize as SerializeContent } from './Serialize'

import classes from './index.module.scss'

type RichTextProps = {
  className?: string
  content: any
  customRenderers?: CustomRenderers
}

export function RichText({ className, content, customRenderers }: RichTextProps) {
  if (!content) {
    return null
  }

  return (
    <div className={[classes.richText, className].filter(Boolean).join(' ')}>
      <SerializeContent content={content} customRenderers={customRenderers} />
    </div>
  )
}
