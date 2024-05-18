import React, { Fragment } from 'react'

import type { Page } from '../../../payload-types'

import { Gutter } from '../../components/Gutter'
import { CMSLink } from '../../components/Link'
import { Media } from '../../components/Media'
import RichText from '../../components/RichText'
import classes from './index.module.scss'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  return (
    <Gutter className={classes.hero}>
      <div className={classes.content}>
        <RichText content={richText} enableGutter={false} />
        {Array.isArray(links) && links.length > 0 && (
          <ul className={classes.links}>
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className={classes.media}>
        {typeof media === 'object' && (
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
