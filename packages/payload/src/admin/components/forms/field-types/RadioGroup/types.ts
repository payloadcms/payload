import type { RadioField } from '../../../../../fields/config/types.js'

export type Props = Omit<RadioField, 'type'> & {
  path?: string
}

export type OnChange<T = string> = (value: T) => void
