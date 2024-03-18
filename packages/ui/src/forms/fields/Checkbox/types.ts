import type { FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type CheckboxFieldProps = FormFieldBase & {
  checked?: boolean
  disableFormData?: boolean
  id?: string
  label?: FieldBase['label']
  name?: string
  onChange?: (val: boolean) => void
  partialChecked?: boolean
  path?: string
  width?: string
}
