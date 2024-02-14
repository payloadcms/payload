import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  path?: string
  onChange?: OnChange
  value?: string
}

export type OnChange<T = string> = (value: T) => void
