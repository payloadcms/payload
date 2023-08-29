import { OnChange } from '../types.js';

export type Props = {
  isSelected: boolean
  option: {
    label: Record<string, string> | string
    value: string
  }
  onChange: OnChange
  path: string
}
