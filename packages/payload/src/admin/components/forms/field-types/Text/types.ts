import { TextField } from '../../../../../fields/config/types.js';

export type Props = Omit<TextField, 'type'> & {
  path?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}
