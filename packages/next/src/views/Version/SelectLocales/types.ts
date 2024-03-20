import type { OptionObject } from 'payload/types'

export type Props = {
  onChange: (options: OptionObject[]) => void
  options: OptionObject[]
  value: OptionObject[]
}
