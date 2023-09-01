import type React from 'react'

import type { Validate } from '../../../../../fields/config/types'
import type { Description } from '../../FieldDescription/types'

export type Props = {
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
