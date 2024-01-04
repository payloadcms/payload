import type { CheckboxField } from 'payload/types'
import { FormFieldBase } from '../Text/types'

export type Props = FormFieldBase &
  Omit<CheckboxField, 'type'> & {
    disableFormData?: boolean
    onChange?: (val: boolean) => void
  }
