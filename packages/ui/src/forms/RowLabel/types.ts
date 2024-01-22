import React from 'react'

import { RowLabel, RowLabelComponent } from 'payload/types'
import { FormState } from '../..'
import { I18n } from '@payloadcms/translations'

export type Props = {
  className?: string
  label?: RowLabel
  path: string
  rowNumber?: number
  data: FormState
  i18n: I18n
}

export function isComponent(label: RowLabel): label is RowLabelComponent {
  return React.isValidElement(label)
}
