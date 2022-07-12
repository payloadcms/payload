import { OnChange } from '../types';

export type Props = {
  isSelected: boolean
  option: {
    label: string
    value: string
  }
  onChange: OnChange
  path: string
}
