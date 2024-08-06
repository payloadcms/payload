import React, { Fragment } from 'react'

import { Page } from '../../../payload-types'
import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import RichText from '../../_components/RichText'

import classes from './index.module.scss'

export type HighImpactHeroProps = Page['hero']

export const HighImpactHero = ({ richText, media }: HighImpactHeroProps) => {
  return (
    <Gutter className={classes.hero}>
      <div className={classes.content}>
        <RichText content={richText} />
      </div>
      <div className={classes.media}>
        {typeof media === 'object' && media !== null && (
          <Fragment>
            <Media
              resource={media}
              // fill
              imgClassName={classes.image}
              priority
            />
            {media?.caption && <RichText content={media.caption} className={classes.caption} />}
          </Fragment>
        )}
      </div>
    </Gutter>
  )
}
