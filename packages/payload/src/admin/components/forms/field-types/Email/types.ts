import type { EmailField } from '../../../../../fields/config/types.js';

export type Props = Omit<EmailField, 'type'> & {
  path?: string
}
