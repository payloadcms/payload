import type { LocaleOption } from '../types'

export type Props = {
  onChange: (options: LocaleOption[]) => void
  options: LocaleOption[]
  value: LocaleOption[]
}
