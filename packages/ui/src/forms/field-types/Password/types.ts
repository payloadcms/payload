import type React from 'react'

import type { Validate } from 'payload/types'
import type { Description } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  autoComplete?: string
  className?: string
  description?: Description
  disabled?: boolean
  label?: string
  name: string
  path?: string
  required?: boolean
  style?: React.CSSProperties
  validate?: Validate
  width?: string
}
