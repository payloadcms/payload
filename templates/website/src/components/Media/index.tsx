import { Fragment } from 'react'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'
import type { Props } from './types'

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = htmlElement || Fragment

  return (
    <Tag {...(!!htmlElement ? { className } : {})}>
      {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />}
    </Tag>
  )
}
