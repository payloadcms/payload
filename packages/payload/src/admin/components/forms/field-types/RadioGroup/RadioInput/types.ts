import type { OnChange } from '../types.js'

export type Props = {
  isSelected: boolean
  onChange: OnChange
  option: {
    label: Record<string, string> | string
    value: string
  }
  path: string
}
