import React, { Fragment } from 'react'

import { Image } from './Image'
import { Props } from './types'
import { Video } from './Video'

export const Media: React.FC<Props> = props => {
  const { className, resource, htmlElement = 'div' } = props

  const isVideo = typeof resource !== 'string' && resource?.mimeType?.includes('video')
  const Tag = (htmlElement as any) || Fragment

  return (
    // ts-expect-error
    <Tag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? (
        // @ts-expect-error
        <Video {...props} />
      ) : (
        // @ts-expect-error
        <Image {...props} /> // eslint-disable-line
      )}
    </Tag>
  )
}
