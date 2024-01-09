import type { CheckboxField } from 'payload/types'
import type { I18n } from '@payloadcms/translations'
import { FormFieldBase } from '../Text/types'

export type Props = FormFieldBase &
  Omit<CheckboxField, 'type'> & {
    disableFormData?: boolean
    onChange?: (val: boolean) => void
    i18n: I18n
  }
