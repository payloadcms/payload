import { SelectField } from '../../../../../fields/config/types.js';

export type Props = Omit<SelectField, 'type'> & {
  path?: string
}
