import { JSONField } from '../../../../../fields/config/types.js';

export type Props = Omit<JSONField, 'type'> & {
  path?: string
}
