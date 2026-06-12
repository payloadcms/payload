'use client'
import { UnpublishButton, useDocumentInfo } from '@payloadcms/ui'
import * as React from 'react'

import classes from './index.module.scss'

export function CustomUnpublishButton() {
  const { hasPublishedDoc, hasPublishPermission, isTrashed } = useDocumentInfo()
  const canUnpublish = hasPublishPermission && hasPublishedDoc && !isTrashed

  if (!canUnpublish) {
    return null
  }

  return (
    <div className={classes.customUnpublishButton}>
      <UnpublishButton label="Custom Unpublish" />
    </div>
  )
}
