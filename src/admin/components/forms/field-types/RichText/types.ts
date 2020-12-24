import { RichTextField } from '../../../../../fields/config/types';

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}
