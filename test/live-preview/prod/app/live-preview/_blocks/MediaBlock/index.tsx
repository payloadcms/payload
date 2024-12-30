import type { StaticImageData } from 'next/image.js'

import React from 'react'

import type { Page } from '../../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import { Media } from '../../_components/Media/index.js'
import RichText from '../../_components/RichText/index.js'
import classes from './index.module.scss'

type Props = {
  id?: string
  staticImage?: StaticImageData
} & Extract<Exclude<Page['layout'], undefined>[0], { blockType: 'mediaBlock' }>

export const MediaBlock: React.FC<Props> = (props) => {
  const { media, position = 'default', staticImage } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div className={classes.mediaBlock}>
      {position === 'fullscreen' && (
        <div className={classes.fullscreen}>
          <Media resource={media} src={staticImage} />
        </div>
      )}
      {position === 'default' && (
        <Gutter>
          <Media resource={media} src={staticImage} />
        </Gutter>
      )}
      {caption && (
        <Gutter className={classes.caption}>
          <RichText content={caption} />
        </Gutter>
      )}
    </div>
  )
}
