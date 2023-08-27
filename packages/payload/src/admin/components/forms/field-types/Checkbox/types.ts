import { CheckboxField } from '../../../../../fields/config/types.js';

export type Props = Omit<CheckboxField, 'type'> & {
  path?: string
  onChange?: (val: boolean) => void
  disableFormData?: boolean
}
