import { LocaleOption } from '../types.js';

export type Props = {
  onChange: (options: LocaleOption[]) => void
  value: LocaleOption[]
  options: LocaleOption[]
}
