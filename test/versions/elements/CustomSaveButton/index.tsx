'use client'
import { PublishButton } from '@payloadcms/ui'
import * as React from 'react'

import classes from './index.module.scss'

export function CustomPublishButton() {
  return (
    <div className={classes.customButton}>
      <PublishButton />
    </div>
  )
}
