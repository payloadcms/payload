import { OptionsType, GroupedOptionsType } from 'react-select';

export type Value = {
  label: string
  value: string
  options?: Value[]
}

export type Props = {
  value?: Value | Value[],
  onChange?: (value: any) => void,
  disabled?: boolean,
  showError?: boolean,
  formatValue?: (value: Value) => string[] | string,
  options: OptionsType<Value> | GroupedOptionsType<Value>
  isMulti?: boolean,
  isDisabled?: boolean
  onInputChange?: (val: string) => void
  onMenuScrollToBottom?: () => void
  findValueInOptions: (options: Value[], value: Value) => Value | Value[]
}
