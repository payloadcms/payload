import type { LabelFunction } from '../../config/types.js'

export type LabelProps = {
  CustomLabel?: React.ReactNode
  as?: 'label' | 'span'
  htmlFor?: string
  label?: LabelFunction | Record<string, string> | false | string
  required?: boolean
  unstyled?: boolean
}
