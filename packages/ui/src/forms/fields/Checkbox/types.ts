import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  checked?: boolean
  disableFormData?: boolean
  id?: string
  name?: string
  onChange?: (val: boolean) => void
  partialChecked?: boolean
  path?: string
}
