'use client'

import React from 'react'

import { CustomRenderers, Serialize as SerializeContent } from './serialize'

export const RichText: React.FC<{
  content: any
  customRenderers?: CustomRenderers
  className?: string
}> = ({ content, customRenderers, className }) => {
  if (!content) {
    return null
  }

  return (
    <div className={className}>
      <SerializeContent content={content} customRenderers={customRenderers} />
    </div>
  )
}
