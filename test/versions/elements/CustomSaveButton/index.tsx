'use client'
import type { CustomPublishButton as CustomPublishButtonType } from 'payload/types'

import { DefaultPublishButton } from '@payloadcms/ui/elements/Publish'
import * as React from 'react'

import classes from './index.module.scss'

export const CustomPublishButton: CustomPublishButtonType = () => {
  return (
    <div className={classes.customButton}>
      <DefaultPublishButton />
    </div>
  )
}
