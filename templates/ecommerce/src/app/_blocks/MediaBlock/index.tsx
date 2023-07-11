import React from 'react'

import { Page } from '../../../payload-types'
import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import RichText from '../../_components/RichText'

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
