'use client'
import type { GroupFieldLabelServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

export const ListPresetsAccessLabel: GroupFieldLabelServerComponent = ({
  field: { label },
  i18n,
}) => {
  if (!label) {
    return null
  }

  return <p>{getTranslation(label, i18n)}</p>
}
