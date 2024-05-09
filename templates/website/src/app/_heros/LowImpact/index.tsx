import React from 'react'

import type { Page } from '../../../payload-types'

import { Gutter } from '../../_components/Gutter'
import RichText from '../../_components/RichTextLexical'
import { VerticalPadding } from '../../_components/VerticalPadding'
import classes from './index.module.scss'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <Gutter className={classes.lowImpactHero}>
      <div className={`${classes.content} ${children ? classes.noRichText : ''}`}>
        <VerticalPadding>
          {children || <RichText className={classes.richText} content={richText} />}
        </VerticalPadding>
      </div>
    </Gutter>
  )
}
