'use client'
import type { JSX, KeyboardEventHandler } from 'react'
import type { GroupBase, MenuProps, StylesConfig } from 'react-select'

import { arrayMove } from '@dnd-kit/sortable'
import { getTranslation } from '@payloadcms/translations'
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Select, { components as rsComponents } from 'react-select'
import CreatableSelect from 'react-select/creatable'

import type { Option, ReactSelectAdapterProps } from './types.js'
export type { Option } from './types.js'

import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useTheme } from '../../providers/Theme/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { ClearIndicator } from './ClearIndicator/index.js'
import { Control } from './Control/index.js'
import { DropdownIndicator } from './DropdownIndicator/index.js'
import { getCaptureMenuScroll } from './getCaptureMenuScroll.js'
import { getMenuListStyles } from './getMenuListStyles.js'
import { Input } from './Input/index.js'
import { generateMultiValueDraggableID, MultiValue } from './MultiValue/index.js'
import { MultiValueLabel } from './MultiValueLabel/index.js'
import { MultiValueRemove } from './MultiValueRemove/index.js'
import { SingleValue } from './SingleValue/index.js'
import { ValueContainer } from './ValueContainer/index.js'
import './index.css'

// Propagates the nearest scoped theme (via ThemeProvider) into the portal div,
// falling back to the global theme. Ensures dropdown menus portaled to
// document.body inherit the correct theme (e.g. dark Popup).
function ThemedMenuPortal<Opt, IsMulti extends boolean, Group extends GroupBase<Opt>>(
  props: React.ComponentProps<typeof rsComponents.MenuPortal<Opt, IsMulti, Group>>,
) {
  const { theme } = useTheme()
  const menuPortalTheme = (props.selectProps as any)?.customProps?.menuPortalTheme
  return (
    <rsComponents.MenuPortal
      {...props}
      innerProps={{ 'data-theme': menuPortalTheme ?? theme } as JSX.IntrinsicElements['div']}
    />
  )
}

const DEFAULT_MAX_MENU_HEIGHT = 300
const MIN_USABLE_MENU_HEIGHT = 140
const MENU_VIEWPORT_GAP = 16 // space between the control and the edge of the window

const SelectAdapter: React.FC<ReactSelectAdapterProps> = (props) => {
  const { i18n, t } = useTranslation()
  const [inputValue, setInputValue] = useState('') // for creatable select
  const uuid = useId()
  const [hasMounted, setHasMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [maxMenuHeight, setMaxMenuHeight] = useState(DEFAULT_MAX_MENU_HEIGHT)
  const [menuPlacement, setMenuPlacement] = useState<'auto' | 'bottom' | 'top'>('auto')
  const containerRef = useRef<HTMLDivElement>(null)

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
  const captureMenuScroll = getCaptureMenuScroll({
    captureMenuScroll: captureMenuScrollProp,
    menuPortalTarget,
  })

  const updateMenuViewportSettings = useCallback(() => {
    if (!isMenuOpen || typeof window === 'undefined') {
      return
    }

    const controlEl = containerRef.current?.querySelector('.rs__control')

    if (!controlEl) {
      return
    }

    const controlRect = controlEl.getBoundingClientRect()
    const availableBelow = Math.max(window.innerHeight - controlRect.bottom - MENU_VIEWPORT_GAP, 0)
    const availableAbove = Math.max(controlRect.top - MENU_VIEWPORT_GAP, 0)
    const shouldOpenTop = availableBelow < MIN_USABLE_MENU_HEIGHT && availableAbove > availableBelow
    const availableHeight = shouldOpenTop ? availableAbove : availableBelow

    setMenuPlacement(shouldOpenTop ? 'top' : 'bottom')
    setMaxMenuHeight(Math.max(Math.min(Math.floor(availableHeight), DEFAULT_MAX_MENU_HEIGHT), 1))
  }, [isMenuOpen])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPlacement('auto')
      setMaxMenuHeight(DEFAULT_MAX_MENU_HEIGHT)
      return
    }

    updateMenuViewportSettings()

    window.addEventListener('resize', updateMenuViewportSettings)
    window.addEventListener('scroll', updateMenuViewportSettings, true)

    return () => {
      window.removeEventListener('resize', updateMenuViewportSettings)
      window.removeEventListener('scroll', updateMenuViewportSettings, true)
    }
  }, [isMenuOpen, updateMenuViewportSettings])

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

  const handleMenuOpen = () => {
    setIsMenuOpen(true)
    requestAnimationFrame(updateMenuViewportSettings)
    onMenuOpen?.()
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
    onMenuClose?.()
  }

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
    }),
    [externalClassNames, menuClassName],
  )

  const selectComponents = useMemo(
    () => ({
      ClearIndicator,
      Control,
      DropdownIndicator,
      Input,
      MenuPortal: ThemedMenuPortal,
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
    maxMenuHeight,
    menuPlacement,
    menuPortalTarget,
    menuPosition,
    menuShouldBlockScroll: false,
    noOptionsMessage,
    onChange,
    onMenuClose: handleMenuClose,
    onMenuOpen: handleMenuOpen,
    options,
    placeholder: getTranslation(placeholder, i18n),
    styles: {
      // Remove the default react-select z-index from the menu so that our custom
      // z-index in the "payload-default" css layer can take effect, in such a way
      // that end users can easily override it as with other styles.
      menu: (rsStyles, state) => ({
        ...rsStyles,
        zIndex: undefined,
        ...externalStyles?.menu?.(rsStyles, state),
      }),
      // When portaling to document.body, the portal container needs an explicit
      // z-index so the menu appears above drawers and dialogs. unstyled={true}
      // strips react-select's default zIndex:9999 from the portal container.
      ...(menuPortalTarget && {
        menuPortal: (rsStyles, state) => ({
          ...rsStyles,
          zIndex: 9999,
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
      menuList: getMenuListStyles(externalStyles),
    },
    unstyled: true,
  }

  if (!hasMounted) {
    return <ShimmerEffect height="var(--field-min-height)" />
  }

  if (!isCreatable) {
    return (
      <div ref={containerRef}>
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
    <div ref={containerRef}>
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
