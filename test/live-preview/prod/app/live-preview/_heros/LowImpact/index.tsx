import React from 'react'

import type { Page } from '../../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import RichText from '../../_components/RichText/index.js'
import { VerticalPadding } from '../../_components/VerticalPadding/index.js'
import classes from './index.module.scss'

export const LowImpactHero: React.FC<Page['hero']> = ({ richText }) => {
  return (
    <Gutter className={classes.lowImpactHero}>
      <div className={classes.content}>
        <VerticalPadding>
          <RichText className={classes.richText} content={richText} />
        </VerticalPadding>
      </div>
    </Gutter>
  )
}
