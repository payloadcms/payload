import type { TextareaField } from '../../../../../fields/config/types.js';

export type Props = Omit<TextareaField, 'type'> & {
  path?: string
}
