import type { OptionObject } from 'payload'

export type Props = {
  onChange: (options: OptionObject[]) => void
  options: OptionObject[]
  value: OptionObject[]
}
