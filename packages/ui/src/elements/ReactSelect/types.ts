import type { CommonProps, GroupBase, Props as ReactSelectStateManagerProps } from 'react-select'

import type { DocumentDrawerProps, UseDocumentDrawer } from '../DocumentDrawer/types.js'

type CustomSelectProps = {
  disableKeyDown?: boolean
  disableMouseDown?: boolean
  DocumentDrawerToggler?: ReturnType<UseDocumentDrawer>[1]
  draggableProps?: any
  droppableRef?: React.RefObject<HTMLDivElement | null>
  editableProps?: (
    data: Option<{ label: string; value: string }>,
    className: string,
    selectProps: ReactSelectStateManagerProps,
  ) => any
  onDelete?: DocumentDrawerProps['onDelete']
  onDocumentDrawerOpen?: (args: {
    collectionSlug: string
    hasReadPermission: boolean
    id: number | string
  }) => void
  onDuplicate?: DocumentDrawerProps['onSave']
  onSave?: DocumentDrawerProps['onSave']
}

// augment the types for the `Select` component from `react-select`
// this is to include the `selectProps` prop at the top-level `Select` component
// @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
declare module 'react-select/dist/declarations/src/Select' {
  export interface Props<Option, IsMulti extends boolean, Group extends GroupBase<Option>> {
    customProps?: CustomSelectProps
  }
}

// augment the types for the `CommonPropsAndClassName` from `react-select`
// this will include the `selectProps` prop to every `react-select` component automatically
// @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
declare module 'react-select/dist/declarations/src' {
  export interface CommonPropsAndClassName<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>,
  > extends CommonProps<Option, IsMulti, Group> {
    customProps?: CustomSelectProps & ReactSelectStateManagerProps<Option, IsMulti, Group>
  }
}

export type Option<TValue = unknown> = {
  [key: string]: unknown
  //* The ID is used to identify the option in the UI. If it doesn't exist and value cannot be transformed into a string, sorting won't work */
  id?: string
  value: TValue
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type ReactSelectAdapterProps = {
  backspaceRemovesValue?: boolean
  blurInputOnSelect?: boolean
  className?: string
  components?: {
    [key: string]: React.FC<any>
  }
  customProps?: CustomSelectProps
  disabled?: boolean
  filterOption?:
    | ((
        {
          allowEdit,
          data,
          label,
          value,
        }: { allowEdit: boolean; data: Option; label: string; value: string },
        search: string,
      ) => boolean)
    | undefined
  getOptionValue?: ReactSelectStateManagerProps<
    Option,
    boolean,
    GroupBase<Option>
  >['getOptionValue']
  inputId?: string
  isClearable?: boolean
  /** Allows you to create own values in the UI despite them not being pre-specified */
  isCreatable?: boolean
  isLoading?: boolean
  /** Allows you to specify multiple values instead of just one */
  isMulti?: boolean
  isOptionSelected?: any
  isSearchable?: boolean
  isSortable?: boolean
  menuIsOpen?: boolean
  noOptionsMessage?: (obj: { inputValue: string }) => string
  numberOnly?: boolean
  onChange?: (value: Option | Option[]) => void
  onInputChange?: (val: string) => void
  onMenuClose?: () => void
  onMenuOpen?: () => void
  onMenuScrollToBottom?: () => void
  options: Option[] | OptionGroup[]
  placeholder?: string
  showError?: boolean
  value?: Option | Option[]
}
