'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { $getSelection } from 'lexical'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import type { FloatingToolbarSectionEntry } from '../types'

const baseClass = 'floating-select-toolbar-popup__dropdown-item'

interface DropDownContextType {
  registerItem: (ref: React.RefObject<HTMLButtonElement>) => void
}

const DropDownContext = React.createContext<DropDownContextType | null>(null)

export function DropDownItem({
  children,
  entry,
  title,
}: {
  children: React.ReactNode
  entry: FloatingToolbarSectionEntry
  title?: string
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [enabled, setEnabled] = useState<boolean>(true)
  const [active, setActive] = useState<boolean>(false)
  const [className, setClassName] = useState<string>(baseClass)

  const updateStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (entry.isActive) {
        const isActive = entry.isActive({ editor, selection })
        if (active !== isActive) {
          setActive(isActive)
        }
      }
      if (entry.isEnabled) {
        const isEnabled = entry.isEnabled({ editor, selection })
        if (enabled !== isEnabled) {
          setEnabled(isEnabled)
        }
      }
    })
  }, [active, editor, enabled, entry])

  useEffect(() => {
    updateStates()
  }, [updateStates])

  useEffect(() => {
    document.addEventListener('mouseup', updateStates)
    return () => {
      document.removeEventListener('mouseup', updateStates)
    }
  }, [updateStates])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateStates()
      }),
    )
  }, [editor, updateStates])

  useEffect(() => {
    setClassName(
      [
        baseClass,
        enabled === false ? 'disabled' : '',
        active ? 'active' : '',
        entry?.key ? `${baseClass}-${entry.key}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }, [enabled, active, className, entry.key])

  const ref = useRef<HTMLButtonElement>(null)

  const dropDownContext = React.useContext(DropDownContext)

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
    <button
      className={className}
      onClick={() => {
        if (enabled !== false) {
          entry.onClick({
            editor,
            isActive: active,
          })
        }
      }}
      onMouseDown={(e) => {
        // This is required for Firefox compatibility. Without it, the dropdown will disappear without the onClick being called.
        // This only happens in Firefox. Must be something about how Firefox handles focus events differently.
        e.preventDefault()
      }}
      ref={ref}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function DropDownItems({
  children,
  dropDownRef,
  onClose,
}: {
  children: React.ReactNode
  dropDownRef: React.Ref<HTMLDivElement>
  onClose: () => void
}): JSX.Element {
  const [items, setItems] = useState<Array<React.RefObject<HTMLButtonElement>>>()
  const [highlightedItem, setHighlightedItem] = useState<React.RefObject<HTMLButtonElement>>()

  const registerItem = useCallback(
    (itemRef: React.RefObject<HTMLButtonElement>) => {
      setItems((prev) => (prev != null ? [...prev, itemRef] : [itemRef]))
    },
    [setItems],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (items == null) return

    const { key } = event

    if (['ArrowDown', 'ArrowUp', 'Escape', 'Tab'].includes(key)) {
      event.preventDefault()
    }

    if (key === 'Escape' || key === 'Tab') {
      onClose()
    } else if (key === 'ArrowUp') {
      setHighlightedItem((prev) => {
        if (prev == null) return items[0]
        const index = items.indexOf(prev) - 1
        return items[index === -1 ? items.length - 1 : index]
      })
    } else if (key === 'ArrowDown') {
      setHighlightedItem((prev) => {
        if (prev == null) return items[0]
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

    if (highlightedItem?.current != null) {
      highlightedItem.current.focus()
    }
  }, [items, highlightedItem])

  return (
    <DropDownContext.Provider value={contextValue}>
      <div
        className="floating-select-toolbar-popup__dropdown-items"
        onKeyDown={handleKeyDown}
        ref={dropDownRef}
      >
        {children}
      </div>
    </DropDownContext.Provider>
  )
}

export function DropDown({
  Icon,
  buttonAriaLabel,
  buttonClassName,
  children,
  disabled = false,
  stopCloseOnClickSelf,
}: {
  Icon?: React.FC
  buttonAriaLabel?: string
  buttonClassName: string
  children: ReactNode
  disabled?: boolean
  stopCloseOnClickSelf?: boolean
}): JSX.Element {
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
      const scrollTopOffset = window.pageYOffset || document.documentElement.scrollTop
      dropDown.style.top = `${top + scrollTopOffset + button.offsetHeight + 5}px`
      dropDown.style.left = `${Math.min(left - 5, window.innerWidth - dropDown.offsetWidth - 20)}px`
    }
  }, [dropDownRef, buttonRef, showDropDown])

  useEffect(() => {
    const button = buttonRef.current

    if (button !== null && showDropDown) {
      const handle = (event: MouseEvent): void => {
        const { target } = event
        if (stopCloseOnClickSelf != null) {
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          if (dropDownRef.current != null && dropDownRef.current.contains(target as Node)) {
            return
          }
        }
        if (!button.contains(target as Node)) {
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
        <Icon />
        <i className="floating-select-toolbar-popup__dropdown-caret" />
      </button>

      {showDropDown &&
        createPortal(
          <DropDownItems dropDownRef={dropDownRef} onClose={handleClose}>
            {children}
          </DropDownItems>,
          document.body,
        )}
    </React.Fragment>
  )
}
