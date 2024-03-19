import type { FieldBase } from 'payload/types'

import type { FormFieldBase } from '../shared/index.js'

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
