import React from 'react'
import { Cell, Grid } from '@faceless-ui/css-grid'

import { Gutter } from '../../components/Gutter'
import { CMSLink } from '../../components/Link'
import RichText from '../../components/RichText'
import { Page } from '../../payload-types'

import classes from './index.module.scss'

type Props = Extract<Page['layout'][0], { blockType: 'content' }>

export const ContentBlock: React.FC<
  Props & {
    id?: string
  }
> = props => {
  const { columns } = props

  return (
    <Gutter className={classes.content}>
      <Grid className={classes.grid}>
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, richText, link, size } = col

            let cols

            if (size === 'oneThird') cols = 4
            if (size === 'half') cols = 6
            if (size === 'twoThirds') cols = 8
            if (size === 'full') cols = 10

            return (
              <Cell cols={cols} colsM={4} key={index}>
                <RichText content={richText} />
                {enableLink && <CMSLink className={classes.link} {...link} />}
              </Cell>
            )
          })}
      </Grid>
    </Gutter>
  )
}
