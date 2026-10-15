import type { UIFieldServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { LinkToDocClient } from './index.client.js'

export const LinkToDoc: UIFieldServerComponent = ({ field, i18n }) => {
  const label = field.label ? getTranslation(field.label,
    i18n,
  ) : undefined
  return <LinkToDocClient label={label} />
}
