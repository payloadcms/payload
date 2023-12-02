import type { CheckboxField } from 'payload/types'

export type Props = Omit<CheckboxField, 'type'> & {
  disableFormData?: boolean
  onChange?: (val: boolean) => void
  path?: string
}
