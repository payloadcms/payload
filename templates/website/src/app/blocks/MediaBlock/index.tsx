import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import React from 'react'
import RichText from 'src/app/components/RichText'

import type { Page } from '../../../payload-types'

import { Media } from '../../components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'mediaBlock' }> & {
  id?: string
  staticImage?: StaticImageData
}

export const MediaBlock: React.FC<Props> = (props) => {
  const { media, position = 'default', staticImage } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div
      className={cn('my-16', {
        container: position === 'default',
      })}
    >
      {position === 'fullscreen' && (
        <div className="relative">
          <Media resource={media} src={staticImage} />
        </div>
      )}
      {position === 'default' && <Media resource={media} src={staticImage} />}
      {caption && (
        <div
          className={cn('mt-6', {
            container: position === 'fullscreen',
          })}
        >
          <RichText content={caption} enableGutter={false} />
        </div>
      )}
    </div>
  )
}
