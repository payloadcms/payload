import React from 'react'
import { Cell, Grid } from '@faceless-ui/css-grid'

import { CMSForm } from '../../../components/CMSForm'
import { Gutter } from '../../../components/Gutter'
import { Page } from '../../../payload-types'

import classes from './index.module.scss'

type Props = Extract<Page['layout'][0], { blockType: 'formBlock' }>

export const FormBlock: React.FC<
  Props & {
    id?: string
  }
> = props => {
  const { form, enableIntro, formIntroContent } = props
  if (!form || typeof form === 'string') return null

  return (
    <Gutter className={classes.formBlock}>
      <Grid>
        <Cell cols={10}>
          <div className={classes.formCell}>
            <CMSForm form={form} enableIntro={enableIntro} formIntroContent={formIntroContent} />
          </div>
        </Cell>
      </Grid>
    </Gutter>
  )
}
