import type { OnChange } from '../types'

export type Props = {
  isSelected: boolean
  onChange: OnChange
  option: {
    label: Record<string, string> | string
    value: string
  }
  path: string
  readOnly?: boolean
}
