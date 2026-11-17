'use client'
import { Button } from '@payloadcms/ui'
import { $addUpdateTag, isDOMNode, type LexicalEditor } from 'lexical'
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { ToolbarGroupItem } from '../../types.js'

const baseClass = 'toolbar-popup__dropdown-item'

interface DropDownContextType {
  registerItem: (ref: React.RefObject<HTMLButtonElement | null>) => void
}

const DropDownContext = React.createContext<DropDownContextType | null>(null)

export function DropDownItem({
  active,
  children,
  editor,
  enabled,
  Icon,
  item,
  itemKey,
  tooltip,
}: {
  active?: boolean
  children: React.ReactNode
  editor: LexicalEditor
  enabled?: boolean
  Icon: React.ReactNode
  item: ToolbarGroupItem
  itemKey: string
  tooltip?: string
}): React.ReactNode {
  const className = useMemo(() => {
    return [
      baseClass,
      enabled === false ? 'disabled' : '',
      active ? 'active' : '',
      item?.key ? `${baseClass}-${item.key}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }, [enabled, active, item.key])

  const ref = useRef<HTMLButtonElement>(null)

  const dropDownContext = React.use(DropDownContext)

  if (dropDownContext === null) {
    throw new Error('DropDownItem must be used within a DropDown')
  }

  const { registerItem } = dropDownContext

  useEffect(() => {
    if (ref?.current != null) {
      registerItem(ref)
    }
  }, [ref, registerItem])

  return (
    <Button
      aria-label={tooltip}
      buttonStyle="ghost"
      className={className}
      disabled={enabled === false}
      extraButtonProps={{
        'aria-checked': item.isActive ? Boolean(active) : undefined,
        'data-item-key': itemKey,
        role: item.isActive ? 'menuitemcheckbox' : 'menuitem',
        tabIndex: -1,
      }}
      icon={Icon}
      iconPosition="left"
      onClick={() => {
        if (enabled !== false) {
          editor.focus(() => {
            editor.update(() => {
              $addUpdateTag('toolbar')
            })
            // We need to wrap the onSelect in the callback, so the editor is properly focused before the onSelect is called.
            item.onSelect?.({
              editor,
              isActive: active!,
            })
          })
        }
      }}
      onMouseDown={(e: React.MouseEvent) => {
        // This is required for Firefox compatibility. Without it, the dropdown will disappear without the onClick being called.
        // This only happens in Firefox. Must be something about how Firefox handles focus events differently.
        e.preventDefault()
      }}
      ref={ref}
      tooltip={tooltip}
      type="button"
    >
      {children}
    </Button>
  )
}

function DropDownItems({
  id,
  children,
  dropdownKey,
  dropDownRef,
  itemsContainerClassNames,
  onClose,
  shouldAutoFocus,
}: {
  children: React.ReactNode
  dropdownKey?: string
  dropDownRef: React.Ref<HTMLDivElement>
  id: string
  itemsContainerClassNames?: string[]
  onClose: (options?: { restoreFocus?: boolean }) => void
  shouldAutoFocus: boolean
}): React.ReactElement {
  const [items, setItems] = useState<Array<React.RefObject<HTMLButtonElement | null>>>()
  const [highlightedItem, setHighlightedItem] =
    useState<React.RefObject<HTMLButtonElement | null>>()

  const registerItem = useCallback(
    (itemRef: React.RefObject<HTMLButtonElement | null>) => {
      setItems((prev) => (prev != null ? [...prev, itemRef] : [itemRef]))
    },
    [setItems],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (items == null) {
      return
    }

    const { key } = event
    const enabledItems = items.filter((item) => !item.current?.disabled)

    if (['ArrowDown', 'ArrowUp', 'Escape'].includes(key)) {
      event.preventDefault()
    }

    if (key === 'Escape') {
      onClose()
    } else if (key === 'Tab') {
      setTimeout(() => onClose({ restoreFocus: false }))
    } else if (key === 'ArrowUp') {
      setHighlightedItem((prev) => {
        if (prev == null) {
          return enabledItems[0]
        }
        const index = enabledItems.indexOf(prev) - 1
        return enabledItems[index === -1 ? enabledItems.length - 1 : index]
      })
    } else if (key === 'ArrowDown') {
      setHighlightedItem((prev) => {
        if (prev == null) {
          return enabledItems[0]
        }
        const index = enabledItems.indexOf(prev)
        return enabledItems[index === enabledItems.length - 1 ? 0 : index + 1]
      })
    }
  }

  const contextValue = useMemo(
    () => ({
      registerItem,
    }),
    [registerItem],
  )

  useEffect(() => {
    if (shouldAutoFocus && items != null && highlightedItem == null) {
      setHighlightedItem(items.find((item) => !item.current?.disabled))
    }

    if (highlightedItem != null && highlightedItem?.current != null) {
      highlightedItem.current.focus()
    }
  }, [items, highlightedItem, shouldAutoFocus])

  return (
    <DropDownContext value={contextValue}>
      <div
        className={(itemsContainerClassNames ?? ['toolbar-popup__dropdown-items']).join(' ')}
        data-dropdown-key={dropdownKey}
        data-theme="dark"
        id={id}
        onKeyDown={handleKeyDown}
        popover="manual"
        ref={dropDownRef}
        role="menu"
        tabIndex={-1}
      >
        {children}
      </div>
    </DropDownContext>
  )
}

export function DropDown({
  buttonAriaLabel,
  buttonClassName,
  children,
  disabled = false,
  dropdownKey,
  Icon,
  itemsContainerClassNames,
  label,
  stopCloseOnClickSelf,
}: {
  buttonAriaLabel?: string
  buttonClassName: string
  children: ReactNode
  disabled?: boolean
  dropdownKey: string
  Icon?: React.FC
  itemsContainerClassNames?: string[]
  label?: string
  stopCloseOnClickSelf?: boolean
}): React.ReactNode {
  const dropDownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const openedViaKeyboardRef = useRef(false)
  const generatedId = useId()
  const menuId = `toolbar-dropdown-${dropdownKey}-${generatedId}`
  const [showDropDown, setShowDropDown] = useState(false)

  const handleClose = ({ restoreFocus = true }: { restoreFocus?: boolean } = {}): void => {
    setShowDropDown(false)
    if (restoreFocus && buttonRef?.current != null) {
      buttonRef.current.focus()
    }
  }

  useEffect(() => {
    const button = buttonRef.current
    const dropDown = dropDownRef.current

    if (showDropDown && button !== null && dropDown !== null) {
      if (!dropDown.matches(':popover-open')) {
        dropDown.showPopover()
      }

      const updatePosition = (): void => {
        const { bottom, left, top } = button.getBoundingClientRect()
        const offset = 8
        const gap = 5
        const below = bottom + gap
        const above = top - dropDown.offsetHeight - gap
        const maxTop = Math.max(offset, window.innerHeight - dropDown.offsetHeight - offset)
        const preferredTop =
          below + dropDown.offsetHeight + offset <= window.innerHeight
            ? below
            : above >= offset
              ? above
              : below

        dropDown.style.position = 'fixed'
        dropDown.style.top = `${Math.max(offset, Math.min(preferredTop, maxTop))}px`
        dropDown.style.left = `${Math.max(8, Math.min(left - 5, window.innerWidth - dropDown.offsetWidth - 20))}px`
      }

      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, { capture: true, passive: true })

      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, { capture: true })
      }
    }
  }, [dropDownRef, buttonRef, showDropDown])

  useEffect(() => {
    const button = buttonRef.current

    if (button !== null && showDropDown) {
      const handle = (event: MouseEvent): void => {
        const target = event.target
        if (!isDOMNode(target)) {
          return
        }
        if (stopCloseOnClickSelf) {
          if (dropDownRef.current && dropDownRef.current.contains(target)) {
            return
          }
        }
        if (!button.contains(target)) {
          setShowDropDown(false)
        }
      }
      document.addEventListener('click', handle)

      return () => {
        document.removeEventListener('click', handle)
      }
    }
  }, [dropDownRef, buttonRef, showDropDown, stopCloseOnClickSelf])

  return (
    <React.Fragment>
      <button
        aria-controls={menuId}
        aria-expanded={showDropDown}
        aria-haspopup="menu"
        aria-label={buttonAriaLabel}
        className={buttonClassName + (showDropDown ? ' active' : '')}
        data-dropdown-key={dropdownKey}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault()
          openedViaKeyboardRef.current = false
          setShowDropDown(!showDropDown)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openedViaKeyboardRef.current = true
            setShowDropDown(!showDropDown)
          }
        }}
        onMouseDown={(e) => {
          // This fixes a bug where you are unable to click the button if you are in a NESTED editor (editor in blocks field in editor).
          // Thus only happens if you click on the SVG of the button. Clicking on the outside works. Related issue: https://github.com/payloadcms/payload/issues/4025
          // TODO: Find out why exactly it happens and why e.preventDefault() on the mouseDown fixes it. Write that down here, or potentially fix a root cause, if there is any.
          e.preventDefault()
        }}
        ref={buttonRef}
        type="button"
      >
        {Icon && <Icon />}
        {label && <span className="toolbar-popup__dropdown-label">{label}</span>}
        <i className="toolbar-popup__dropdown-caret" />
      </button>

      {showDropDown && (
        <DropDownItems
          dropdownKey={dropdownKey}
          dropDownRef={dropDownRef}
          id={menuId}
          itemsContainerClassNames={itemsContainerClassNames}
          onClose={handleClose}
          shouldAutoFocus={openedViaKeyboardRef.current}
        >
          {children}
        </DropDownItems>
      )}
    </React.Fragment>
  )
}
