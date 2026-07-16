'use client'
import type { KeyboardEventHandler } from 'react'
import type { GroupBase, MenuListProps, MenuProps } from 'react-select'

import { arrayMove } from '@dnd-kit/sortable'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

import type { Option, ReactSelectAdapterProps } from './types.js'
export type { Option } from './types.js'

import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { ClearIndicator } from './ClearIndicator/index.js'
import { Control } from './Control/index.js'
import { DefaultMenuPortal } from './DefaultMenuPortal.js'
import { DropdownIndicator } from './DropdownIndicator/index.js'
import { getCaptureMenuScroll } from './getCaptureMenuScroll.js'
import { getMenuListStyles } from './getMenuListStyles.js'
import { getMenuStyles } from './getMenuStyles.js'
import { Input } from './Input/index.js'
import { generateMultiValueDraggableID, MultiValue } from './MultiValue/index.js'
import { MultiValueLabel } from './MultiValueLabel/index.js'
import { MultiValueRemove } from './MultiValueRemove/index.js'
import { SingleValue } from './SingleValue/index.js'
import { ValueContainer } from './ValueContainer/index.js'
import './index.css'

const DEFAULT_MAX_MENU_HEIGHT = 300

const SelectAdapter: React.FC<ReactSelectAdapterProps> = (props) => {
  const { i18n, t } = useTranslation()
  const [inputValue, setInputValue] = useState('') // for creatable select
  const uuid = useId()
  const [hasMounted, setHasMounted] = useState(false)

  const {
    captureMenuScroll: captureMenuScrollProp,
    className,
    classNames: externalClassNames,
    components,
    disabled = false,
    filterOption = undefined,
    getOptionValue,
    isClearable = true,
    isCreatable,
    isLoading,
    isSearchable = true,
    menuPortalTarget: menuPortalTargetProp,
    menuPosition: menuPositionProp,
    noOptionsMessage = () => t('general:noOptions'),
    numberOnly = false,
    onChange,
    onMenuClose,
    onMenuOpen,
    options,
    placeholder = t('general:selectValue'),
    showError,
    styles: externalStyles,
    value,
  } = props

  const menuPortalTarget =
    menuPortalTargetProp === undefined
      ? typeof document !== 'undefined'
        ? document.body
        : null
      : menuPortalTargetProp

  const menuPosition = menuPositionProp ?? (menuPortalTarget ? 'fixed' : undefined)
  const shouldUseFloatingMenuPortal = Boolean(menuPortalTarget && !components?.MenuPortal)
  const captureMenuScroll = getCaptureMenuScroll({
    captureMenuScroll: captureMenuScrollProp,
    menuPortalTarget,
  })

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Debounce the loading state so that fast option fetches (e.g. relationship
  // fields that resolve almost instantly) don't cause the clear indicator to
  // flash to react-select's loading indicator and back. The loading indicator
  // only appears once a load takes longer than the threshold below.
  const [isLoadingDebounced, setIsLoadingDebounced] = useState(false)

  useDebouncedEffect(
    () => {
      setIsLoadingDebounced(isLoading)
    },
    [isLoading],
    250,
  )

  const menuClassName = useCallback(
    (state: MenuProps<Option, boolean, GroupBase<Option>>) => {
      const placement = state.placement ? `rs__menu--placement-${state.placement}` : ''
      const external = externalClassNames?.menu?.(state) ?? ''
      return [placement, external].filter(Boolean).join(' ')
    },
    [externalClassNames],
  )

  const selectClassNames = useMemo(
    () => ({
      ...externalClassNames,
      menu: menuClassName,
      menuList: (state: MenuListProps<Option, boolean, GroupBase<Option>>) => {
        const external = externalClassNames?.menuList?.(state) ?? ''
        return ['scrollbar-thin', external].filter(Boolean).join(' ')
      },
    }),
    [externalClassNames, menuClassName],
  )

  const selectComponents = useMemo(
    () => ({
      ClearIndicator,
      Control,
      DropdownIndicator,
      Input,
      MenuPortal: DefaultMenuPortal,
      MultiValue,
      MultiValueLabel,
      MultiValueRemove,
      SingleValue,
      ValueContainer,
      ...components,
    }),
    [components],
  )

  const sharedSelectProps = {
    captureMenuScroll,
    className: [className, 'react-select', showError && 'react-select--error']
      .filter(Boolean)
      .join(' '),
    classNamePrefix: 'rs',
    classNames: selectClassNames,
    components: selectComponents,
    filterOption,
    instanceId: uuid,
    isClearable,
    isDisabled: disabled,
    isLoading: isLoadingDebounced,
    isSearchable,
    loadingMessage: () => t('general:loading') + '...',
    maxMenuHeight: DEFAULT_MAX_MENU_HEIGHT,
    menuPlacement: 'auto' as const,
    menuPortalTarget,
    menuPosition,
    menuShouldBlockScroll: false,
    noOptionsMessage,
    onChange,
    onMenuClose,
    onMenuOpen,
    options,
    placeholder: getTranslation(placeholder, i18n),
    styles: {
      menu: getMenuStyles({
        externalStyles,
        shouldUseFloatingMenuPortal,
      }),
      // When portaling to document.body, the portal container needs an explicit
      // z-index so the menu appears above drawers and dialogs. unstyled={true}
      // strips react-select's default zIndex:9999 from the portal container.
      ...(menuPortalTarget && {
        menuPortal: (rsStyles, state) => ({
          ...rsStyles,
          zIndex: 'var(--z-portal-element)',
          ...externalStyles?.menuPortal?.(rsStyles, state),
        }),
      }),
      // Remove the default react-select min-height so our CSS can control it
      control: (rsStyles, state) => ({
        ...rsStyles,
        minHeight: undefined,
        ...externalStyles?.control?.(rsStyles, state),
      }),
      // Allow external option styles to override emotion defaults
      option: (rsStyles, state) => ({
        ...rsStyles,
        ...externalStyles?.option?.(rsStyles, state),
      }),
      // Keep react-select's computed maxHeight so the menu can fit available
      // viewport space near screen edges (instead of using a fixed class value).
      menuList: getMenuListStyles(externalStyles, shouldUseFloatingMenuPortal),
    },
    unstyled: true,
  }

  if (!hasMounted) {
    return <ShimmerEffect height="var(--field-min-height-large)" />
  }

  if (!isCreatable) {
    return (
      <div>
        <Select<Option, boolean, GroupBase<Option>>
          {...props}
          {...sharedSelectProps}
          getOptionValue={getOptionValue}
          value={value}
        />
      </div>
    )
  }

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (numberOnly === true) {
      const acceptableKeys = [
        'Tab',
        'Escape',
        'Backspace',
        'Enter',
        'ArrowRight',
        'ArrowLeft',
        'ArrowUp',
        'ArrowDown',
      ]
      const isNumber = !/\D/.test(event.key)
      const isActionKey = acceptableKeys.includes(event.key)
      if (!isNumber && !isActionKey) {
        event.preventDefault()
        return
      }
    }

    if (!value || !inputValue || inputValue.trim() === '') {
      return
    }

    if (filterOption && !filterOption(null, inputValue)) {
      return
    }

    if (event.nativeEvent.isComposing) {
      return
    }

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        onChange([
          ...(value as Option[]),
          {
            label: inputValue,
            value: inputValue,
          },
        ])
        setInputValue('')
        event.preventDefault()
        break
      default:
        break
    }
  }

  return (
    <div>
      <CreatableSelect<Option, boolean, GroupBase<Option>>
        {...props}
        {...sharedSelectProps}
        inputValue={inputValue}
        onInputChange={(newValue) => setInputValue(newValue)}
        onKeyDown={handleKeyDown}
        value={value}
      />
    </div>
  )
}

const SortableSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { getOptionValue, onChange, value } = props

  let draggableIDs: string[] = []
  if (value) {
    draggableIDs = (Array.isArray(value) ? value : [value]).map((optionValue) => {
      return generateMultiValueDraggableID(optionValue, getOptionValue)
    })
  }

  return (
    <DraggableSortable
      className="react-select-container"
      ids={draggableIDs}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        let sorted = value
        if (value && Array.isArray(value)) {
          sorted = arrayMove(value, moveFromIndex, moveToIndex)
        }
        onChange(sorted)
      }}
    >
      <SelectAdapter {...props} />
    </DraggableSortable>
  )
}

export const ReactSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { isMulti, isSortable } = props

  if (isMulti && isSortable) {
    return <SortableSelect {...props} />
  }

  return <SelectAdapter {...props} />
}
