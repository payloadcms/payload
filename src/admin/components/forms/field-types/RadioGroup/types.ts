import { RadioField } from '../../../../../fields/config/types';

export type Props = Omit<RadioField, 'type'> & {
  path?: string
}
