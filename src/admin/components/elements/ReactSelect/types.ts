import { Ref } from 'react';

export type Option = {
  [key: string]: unknown
  value: unknown
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type Props = {
  className?: string
  value?: Option | Option[],
  onChange?: (value: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  onMenuOpen?: () => void
  disabled?: boolean,
  showError?: boolean,
  options: Option[] | OptionGroup[]
  isMulti?: boolean,
  isLoading?: boolean
  isOptionSelected?: any
  isSortable?: boolean,
  isDisabled?: boolean
  onInputChange?: (val: string) => void
  onMenuScrollToBottom?: () => void
  placeholder?: string
  isSearchable?: boolean
  isClearable?: boolean
  blurInputOnSelect?: boolean
  filterOption?:
  | (({ label, value, data }: { label: string, value: string, data: Option }, search: string) => boolean)
  | undefined,
  components?: {
    [key: string]: React.FC<any>
  }
  selectProps?: {
    disableMouseDown?: boolean
    disableKeyDown?: boolean
    [key: string]: unknown
  }
}
