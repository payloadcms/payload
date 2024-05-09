import React from 'react'
import RichText from 'src/app/_components/RichTextLexical'

import type { Page } from '../../../payload-types'

import { Gutter } from '../../_components/Gutter'
import { CMSLink } from '../../_components/Link'
import classes from './index.module.scss'

type Props = Extract<Page['layout'][0], { blockType: 'content' }>

export const ContentBlock: React.FC<
  Props & {
    id?: string
  }
> = (props) => {
  const { columns } = props

  return (
    <Gutter className={classes.content}>
      <div className={classes.grid}>
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size } = col

            return (
              <div className={[classes.column, classes[`column--${size}`]].join(' ')} key={index}>
                <RichText content={richText} />
                {enableLink && <CMSLink className={classes.link} {...link} />}
              </div>
            )
          })}
      </div>
    </Gutter>
  )
}
