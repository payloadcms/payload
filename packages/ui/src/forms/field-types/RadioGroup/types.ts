import type { RadioField } from 'payload/types'

export type Props = Omit<RadioField, 'type'> & {
  path?: string
}

export type OnChange<T = string> = (value: T) => void
