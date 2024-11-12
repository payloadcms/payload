import React, { Fragment } from 'react'

import type { Page } from '../../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import { Media } from '../../_components/Media/index.js'
import RichText from '../../_components/RichText/index.js'
import classes from './index.module.scss'

export const HighImpactHero: React.FC<Page['hero']> = ({ media, richText }) => {
  return (
    <Gutter className={classes.hero}>
      <div className={classes.content}>
        <RichText content={richText} />
      </div>
      <div className={classes.media}>
        {typeof media === 'object' && media !== null && (
          <Fragment>
            <Media
              // fill
              imgClassName={classes.image}
              priority
              resource={media}
            />
            {media?.caption && <RichText className={classes.caption} content={media.caption} />}
          </Fragment>
        )}
      </div>
    </Gutter>
  )
}
