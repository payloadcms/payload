import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  disableFormData?: boolean
  onChange?: (val: boolean) => void
  partialChecked?: boolean
  checked?: boolean
  id?: string
}
