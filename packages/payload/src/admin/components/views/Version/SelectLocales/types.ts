import type { LocaleOption } from '../types.js';

export type Props = {
  onChange: (options: LocaleOption[]) => void
  options: LocaleOption[]
  value: LocaleOption[]
}
