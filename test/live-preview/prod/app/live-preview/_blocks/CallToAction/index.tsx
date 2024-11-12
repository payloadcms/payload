import React from 'react'

import type { Page } from '../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import { CMSLink } from '../../_components/Link/index.js'
import RichText from '../../_components/RichText/index.js'
import { VerticalPadding } from '../../_components/VerticalPadding/index.js'
import classes from './index.module.scss'

type Props = Extract<Exclude<Page['layout'], undefined>[0], { blockType: 'cta' }>

export const CallToActionBlock: React.FC<
  {
    id?: string
  } & Props
> = ({ invertBackground, links, richText }) => {
  return (
    <Gutter>
      <VerticalPadding
        className={[classes.callToAction, invertBackground && classes.invert]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={classes.wrap}>
          <div className={classes.content}>
            <RichText className={classes.richText} content={richText} />
          </div>
          <div className={classes.linkGroup}>
            {(links || []).map(({ link }, i) => {
              return <CMSLink key={i} {...link} invert={invertBackground} />
            })}
          </div>
        </div>
      </VerticalPadding>
    </Gutter>
  )
}
