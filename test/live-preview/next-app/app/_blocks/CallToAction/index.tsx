import React from 'react'

import { Page } from '../../../payload-types'
import { Gutter } from '../../_components/Gutter'
import { CMSLink } from '../../_components/Link'
import RichText from '../../_components/RichText'
import { VerticalPadding } from '../../_components/VerticalPadding'

import classes from './index.module.scss'

type Props = Extract<Exclude<Page['layout'], undefined>[0], { blockType: 'cta' }>

export type CallToActionBlockProps = Props & {
  id?: string
}

export const CallToActionBlock = ({
  links,
  richText,
  invertBackground,
}: CallToActionBlockProps) => {
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
