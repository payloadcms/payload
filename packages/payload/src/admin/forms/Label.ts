export type LabelProps = {
  CustomLabel?: React.ReactNode
  as?: 'label' | 'span'
  htmlFor?: string
  label?: Record<string, string> | string
  required?: boolean
  unstyled?: boolean
}

export type SanitizedLabelProps = Omit<LabelProps, 'label' | 'required'>
