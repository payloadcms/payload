import React from 'react'
import { Cell, Grid } from '@faceless-ui/css-grid'

import { BackgroundColor } from '../../components/BackgroundColor'
import { Gutter } from '../../components/Gutter'
import { CMSLink } from '../../components/Link'
import RichText from '../../components/RichText'
import { VerticalPadding } from '../../components/VerticalPadding'
import { Page } from '../../payload-types'

import classes from './index.module.scss'

type Props = Extract<Page['layout'][0], { blockType: 'cta' }>

export const CallToActionBlock: React.FC<
  Props & {
    id?: string
  }
> = ({ ctaBackgroundColor, links, richText }) => {
  const oppositeBackgroundColor = ctaBackgroundColor === 'white' ? 'black' : 'white'

  return (
    <Gutter>
      <BackgroundColor color={oppositeBackgroundColor}>
        <VerticalPadding className={classes.callToAction}>
          <Grid>
            <Cell cols={8} colsL={7} colsM={12}>
              <div>
                <RichText className={classes.richText} content={richText} />
              </div>
            </Cell>
            <Cell start={10} cols={3} startL={9} colsL={4} startM={1} colsM={12}>
              <div className={classes.linkGroup}>
                {(links || []).map(({ link }, i) => {
                  return <CMSLink key={i} {...link} />
                })}
              </div>
            </Cell>
          </Grid>
        </VerticalPadding>
      </BackgroundColor>
    </Gutter>
  )
}
