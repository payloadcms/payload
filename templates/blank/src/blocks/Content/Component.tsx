import React from 'react'
import RichText from '@/components/RichText'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const { richText } = props

  return <div>{richText && <RichText data={richText} />}</div>
}
