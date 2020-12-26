import { TextField } from '../../../../../fields/config/types';

export type Props = Omit<TextField, 'type'> & {
  path?: string
}
