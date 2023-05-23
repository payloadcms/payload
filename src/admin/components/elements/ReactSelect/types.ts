import { CommonProps, GroupBase, Props as ReactSelectStateManagerProps } from 'react-select';
import { DocumentDrawerProps } from '../DocumentDrawer/types';

type CustomSelectProps = {
  disableMouseDown?: boolean
  disableKeyDown?: boolean
  droppableRef?: React.RefObject<HTMLDivElement>
  setDrawerIsOpen?: (isOpen: boolean) => void
  onSave?: DocumentDrawerProps['onSave']
  draggableProps?: any
}

// augment the types for the `Select` component from `react-select`
// this is to include the `selectProps` prop at the top-level `Select` component
declare module 'react-select/dist/declarations/src/Select' {
  export interface Props<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
  > {
    customProps?: CustomSelectProps
  }
}

// augment the types for the `CommonPropsAndClassName` from `react-select`
// this will include the `selectProps` prop to every `react-select` component automatically
declare module 'react-select/dist/declarations/src' {
  export interface CommonPropsAndClassName<Option, IsMulti extends boolean, Group extends GroupBase<Option>> extends CommonProps<Option, IsMulti, Group> {
    customProps?: ReactSelectStateManagerProps<Option, IsMulti, Group> & CustomSelectProps
  }
}

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
  selectProps?: CustomSelectProps
}
