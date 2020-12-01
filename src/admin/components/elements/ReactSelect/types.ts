import { ValueType, OptionsType, GroupedOptionsType } from 'react-select';

export type Value = {
  label: string
  value: string
  options?: Value[]
}

export type Props = {
  value?: ValueType<Value>,
  onChange?: (value: any) => void,
  disabled?: boolean,
  showError?: boolean,
  formatValue?: (value: ValueType<Value>) => string[] | string,
  options: OptionsType<Value> | GroupedOptionsType<Value>
  isMulti?: boolean,
  isDisabled?: boolean
}
