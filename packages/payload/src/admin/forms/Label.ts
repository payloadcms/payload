export type LabelProps = {
  CustomLabel?: React.ReactNode
  as?: 'label' | 'span'
  htmlFor?: string
  label?: Record<string, string> | false | string
  required?: boolean
  unstyled?: boolean
}
