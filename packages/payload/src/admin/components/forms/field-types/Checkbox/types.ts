import type { CheckboxField } from '../../../../../fields/config/types'

export type Props = Omit<CheckboxField, 'type'> & {
  disableFormData?: boolean
  onChange?: (val: boolean) => void
  path?: string
}
