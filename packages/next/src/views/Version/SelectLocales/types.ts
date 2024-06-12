import type { OptionObject } from 'payload/bundle'

export type Props = {
  onChange: (options: OptionObject[]) => void
  options: OptionObject[]
  value: OptionObject[]
}
