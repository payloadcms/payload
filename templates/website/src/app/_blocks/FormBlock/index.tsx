import React from 'react'

import { Page } from '../../../payload/payload-types'
import { CMSForm } from '../../_components/CMSForm'
import { Gutter } from '../../_components/Gutter'

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
      <div className={classes.formCell}>
        <CMSForm form={form} enableIntro={enableIntro} formIntroContent={formIntroContent} />
      </div>
    </Gutter>
  )
}
