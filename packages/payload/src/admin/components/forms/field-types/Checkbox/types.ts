import type { CheckboxField } from '../../../../../fields/config/types.js'

export type Props = Omit<CheckboxField, 'type'> & {
  disableFormData?: boolean
  onChange?: (val: boolean) => void
  path?: string
}
