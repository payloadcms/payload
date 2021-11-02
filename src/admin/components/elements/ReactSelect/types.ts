import { OptionsType, GroupedOptionsType } from 'react-select';

export type Value = {
  label: string
  value: any
  options?: Value[]
}

export type Props = {
  className?: string
  value?: Value | Value[],
  onChange?: (value: any) => void,
  disabled?: boolean,
  showError?: boolean,
  options: OptionsType<Value> | GroupedOptionsType<Value>
  isMulti?: boolean,
  isDisabled?: boolean
  onInputChange?: (val: string) => void
  onMenuScrollToBottom?: () => void
  placeholder?: string
}
