import React from 'react'

import { Gutter } from '../../components/Gutter'
import { Media } from '../../components/Media'
import RichText from '../../components/RichText'
import { Page } from '../../payload-types'

import classes from './index.module.scss'

type Props = Extract<Page['layout'][0], { blockType: 'mediaBlock' }>

export const MediaBlock: React.FC<
  Props & {
    id?: string
  }
> = props => {
  const { media, position = 'default' } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div className={classes.mediaBlock}>
      {position === 'fullscreen' && (
        <div>
          <Media resource={media} />
        </div>
      )}
      {position === 'default' && (
        <Gutter>
          <div>
            <Media resource={media} />
          </div>
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
