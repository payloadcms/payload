import { SelectField } from '../../../../../fields/config/types';

export type Option = {
  label: string
  value: any
}

export type Props = Omit<SelectField, 'type'> & {
  path?: string
}
