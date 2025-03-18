'use client'
import { Button } from '@payloadcms/ui'
import { $addUpdateTag, isDOMNode, type LexicalEditor } from 'lexical'
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  tooltip,
}: {
  active?: boolean
  children: React.ReactNode
  editor: LexicalEditor
  enabled?: boolean
  Icon: React.ReactNode
  item: ToolbarGroupItem
  tooltip?: string
}): React.ReactNode {
  const [className, setClassName] = useState<string>(baseClass)

  useEffect(() => {
    setClassName(
      [
        baseClass,
        enabled === false ? 'disabled' : '',
        active ? 'active' : '',
        item?.key ? `${baseClass}-${item.key}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }, [enabled, active, className, item.key])

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
      buttonStyle="none"
      className={className}
      disabled={enabled === false}
      icon={Icon}
      iconPosition="left"
      iconStyle="none"
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
      onMouseDown={(e) => {
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
  children,
  dropDownRef,
  itemsContainerClassNames,
  onClose,
}: {
  children: React.ReactNode
  dropDownRef: React.Ref<HTMLDivElement>
  itemsContainerClassNames?: string[]
  onClose: () => void
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

    if (['ArrowDown', 'ArrowUp', 'Escape', 'Tab'].includes(key)) {
      event.preventDefault()
    }

    if (key === 'Escape' || key === 'Tab') {
      onClose()
    } else if (key === 'ArrowUp') {
      setHighlightedItem((prev) => {
        if (prev == null) {
          return items[0]
        }
        const index = items.indexOf(prev) - 1
        return items[index === -1 ? items.length - 1 : index]
      })
    } else if (key === 'ArrowDown') {
      setHighlightedItem((prev) => {
        if (prev == null) {
          return items[0]
        }
        return items[items.indexOf(prev) + 1]
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
    if (items != null && highlightedItem == null) {
      setHighlightedItem(items[0])
    }

    if (highlightedItem != null && highlightedItem?.current != null) {
      highlightedItem.current.focus()
    }
  }, [items, highlightedItem])

  return (
    <DropDownContext value={contextValue}>
      <div
        className={(itemsContainerClassNames ?? ['toolbar-popup__dropdown-items']).join(' ')}
        onKeyDown={handleKeyDown}
        ref={dropDownRef}
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
  Icon,
  itemsContainerClassNames,
  label,
  stopCloseOnClickSelf,
}: {
  buttonAriaLabel?: string
  buttonClassName: string
  children: ReactNode
  disabled?: boolean
  Icon?: React.FC
  itemsContainerClassNames?: string[]
  label?: string
  stopCloseOnClickSelf?: boolean
}): React.ReactNode {
  const dropDownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [showDropDown, setShowDropDown] = useState(false)

  const handleClose = (): void => {
    setShowDropDown(false)
    if (buttonRef?.current != null) {
      buttonRef.current.focus()
    }
  }

  useEffect(() => {
    const button = buttonRef.current
    const dropDown = dropDownRef.current

    if (showDropDown && button !== null && dropDown !== null) {
      const { left, top } = button.getBoundingClientRect()
      const scrollTopOffset = window.scrollY || document.documentElement.scrollTop
      dropDown.style.top = `${top + scrollTopOffset + button.offsetHeight + 5}px`
      dropDown.style.left = `${Math.min(left - 5, window.innerWidth - dropDown.offsetWidth - 20)}px`
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

  const portal = createPortal(
    <DropDownItems
      dropDownRef={dropDownRef}
      itemsContainerClassNames={itemsContainerClassNames}
      onClose={handleClose}
    >
      {children}
    </DropDownItems>,
    document.body,
  )

  return (
    <React.Fragment>
      <button
        aria-label={buttonAriaLabel}
        className={buttonClassName + (showDropDown ? ' active' : '')}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault()
          setShowDropDown(!showDropDown)
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

      {showDropDown && <React.Fragment>{portal}</React.Fragment>}
    </React.Fragment>
  )
}
