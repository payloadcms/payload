import React, { Fragment } from 'react'

import type { Page } from '../../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import { CMSLink } from '../../_components/Link/index.js'
import RichText from '../../_components/RichText/index.js'
import classes from './index.module.scss'

type Props = Extract<Exclude<Page['layout'], undefined>[0], { blockType: 'content' }>

export const ContentBlock: React.FC<
  {
    id?: string
  } & Props
> = (props) => {
  const { columns } = props

  return (
    <Gutter className={classes.content}>
      <div className={classes.grid}>
        {columns && columns.length > 0 ? (
          <Fragment>
            {columns.map((col, index) => {
              const { enableLink, link, richText, size } = col

              return (
                <div className={[classes.column, classes[`column--${size}`]].join(' ')} key={index}>
                  <RichText content={richText} />
                  {enableLink && <CMSLink className={classes.link} {...link} />}
                </div>
              )
            })}
          </Fragment>
        ) : null}
      </div>
    </Gutter>
  )
}
