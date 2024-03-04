import type { I18n } from '@payloadcms/translations'
import type { FormState, RowLabel, RowLabelComponent } from 'payload/types'

import React from 'react'

export type Props = {
  className?: string
  data: FormState
  i18n: I18n
  label?: RowLabel
  path: string
  rowNumber?: number
}

export function isComponent(label: RowLabel): label is RowLabelComponent {
  return React.isValidElement(label)
}
