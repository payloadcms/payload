'use client'
import type { BaseSelection, LexicalCommand, LexicalEditor, TextNode } from 'lexical'
import type { JSX, ReactPortal, RefObject } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { MenuTextMatch } from '../useMenuTriggerMatch.js'
import type { SlashMenuGroupInternal, SlashMenuItem, SlashMenuItemInternal } from './types.js'

import { CAN_USE_DOM } from '../../../utils/canUseDOM.js'

export type MenuResolution = {
  getRect: () => DOMRect
  match?: MenuTextMatch
}

const baseClass = 'slash-menu-popup'

export type MenuRenderFn = (
  anchorElementRef: RefObject<HTMLElement | null>,
  itemProps: {
    groups: Array<SlashMenuGroupInternal>
    selectedItemKey: null | string
    selectItemAndCleanUp: (selectedItem: SlashMenuItem) => void
    setSelectedItemKey: (itemKey: string) => void
  },
  matchingString: null | string,
) => JSX.Element | null | ReactPortal

const scrollIntoViewIfNeeded = (target: HTMLElement) => {
  const typeaheadContainerNode = document.getElementById('slash-menu')
  if (!typeaheadContainerNode) {
    return
  }

  const typeaheadRect = typeaheadContainerNode.getBoundingClientRect()

  if (typeaheadRect.top + typeaheadRect.height > window.innerHeight) {
    typeaheadContainerNode.scrollIntoView({
      block: 'center',
    })
  }

  if (typeaheadRect.top < 0) {
    typeaheadContainerNode.scrollIntoView({
      block: 'center',
    })
  }

  target.scrollIntoView({ block: 'nearest' })
}

/**
 * Walk backwards along user input and forward through entity title to try
 * and replace more of the user's text with entity.
 */
function getFullMatchOffset(documentText: string, entryText: string, offset: number) {
  let triggerOffset = offset
  for (let i = triggerOffset; i <= entryText.length; i++) {
    if (documentText.substring(documentText.length - i) === entryText.substring(0, i)) {
      triggerOffset = i
    }
  }
  return triggerOffset
}

/**
 * Split Lexical TextNode and return a new TextNode only containing matched text.
 * Common use cases include: removing the node, replacing with a new node.
 */
function $splitNodeContainingQuery(match: MenuTextMatch): TextNode | undefined {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return
  }
  const anchor = selection.anchor
  if (anchor.type !== 'text') {
    return
  }
  const anchorNode = anchor.getNode()
  if (!anchorNode.isSimpleText()) {
    return
  }
  const selectionOffset = anchor.offset
  const textContent = anchorNode.getTextContent().slice(0, selectionOffset)
  const characterOffset = match.replaceableString.length
  const queryOffset = getFullMatchOffset(textContent, match.matchingString, characterOffset)
  const startOffset = selectionOffset - queryOffset
  if (startOffset < 0) {
    return
  }
  let newNode
  if (startOffset === 0) {
    ;[newNode] = anchorNode.splitText(selectionOffset)
  } else {
    ;[, newNode] = anchorNode.splitText(startOffset, selectionOffset)
  }

  return newNode
}

// Got from https://stackoverflow.com/a/42543908/2013580
export function getScrollParent(
  element: HTMLElement,
  includeHidden: boolean,
): HTMLBodyElement | HTMLElement {
  let style = getComputedStyle(element)
  const excludeStaticParent = style.position === 'absolute'
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/
  if (style.position === 'fixed') {
    return document.body
  }
  for (let parent: HTMLElement | null = element; (parent = parent.parentElement); ) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === 'static') {
      continue
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent
    }
  }
  return document.body
}

function isTriggerVisibleInNearestScrollContainer(
  targetElement: HTMLElement,
  containerElement: HTMLElement,
): boolean {
  const tRect = targetElement.getBoundingClientRect()
  const cRect = containerElement.getBoundingClientRect()
  return tRect.top > cRect.top && tRect.top < cRect.bottom
}

// Reposition the menu on scroll, window resize, and element resize.
export function useDynamicPositioning(
  resolution: MenuResolution | null,
  targetElementRef: RefObject<HTMLElement | null>,
  onReposition: () => void,
  onVisibilityChange?: (isInView: boolean) => void,
) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const targetElement = targetElementRef.current
    if (targetElement != null && resolution != null) {
      const rootElement = editor.getRootElement()
      const rootScrollParent =
        rootElement != null ? getScrollParent(rootElement, false) : document.body
      let ticking = false
      let previousIsInView = isTriggerVisibleInNearestScrollContainer(
        targetElement,
        rootScrollParent,
      )
      const handleScroll = function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            onReposition()
            ticking = false
          })
          ticking = true
        }
        const isInView = isTriggerVisibleInNearestScrollContainer(targetElement, rootScrollParent)
        if (isInView !== previousIsInView) {
          previousIsInView = isInView
          if (onVisibilityChange != null) {
            onVisibilityChange(isInView)
          }
        }
      }
      const resizeObserver = new ResizeObserver(onReposition)
      window.addEventListener('resize', onReposition)
      document.addEventListener('scroll', handleScroll, {
        capture: true,
        passive: true,
      })
      resizeObserver.observe(targetElement)
      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('resize', onReposition)
        document.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [editor, onVisibilityChange, onReposition, resolution, targetElementRef])
}

export const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND: LexicalCommand<{
  index: number
  item: SlashMenuItemInternal
}> = createCommand('SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND')

export function LexicalMenu({
  anchorElementRef,
  close,
  editor,
  // groups filtering is already handled in SlashMenu/index.tsx. Thus, groups always contains the matching items.
  groups,
  menuRenderFn,
  resolution,
  shouldSplitNodeWithQuery = false,
}: {
  anchorElementRef: RefObject<HTMLElement | null>
  close: () => void
  editor: LexicalEditor
  groups: Array<SlashMenuGroupInternal>
  menuRenderFn: MenuRenderFn
  resolution: MenuResolution
  shouldSplitNodeWithQuery?: boolean
}): JSX.Element | null {
  const [selectedItemKey, setSelectedItemKey] = useState<null | string>(null)

  const matchingString = (resolution.match && resolution.match.matchingString) || ''

  const updateSelectedItem = useCallback(
    (item: SlashMenuItem) => {
      const rootElem = editor.getRootElement()
      if (rootElem !== null) {
        rootElem.setAttribute('aria-activedescendant', `${baseClass}__item-${item.key}`)
        setSelectedItemKey(item.key)
      }
    },
    [editor],
  )

  const setSelectedItemKeyToFirstMatchingItem = useCallback(() => {
    // set selected item to the first of the matching ones
    if (groups !== null && matchingString != null) {
      // groups filtering is already handled in SlashMenu/index.tsx. Thus, groups always contains the matching items.
      const allItems = groups.flatMap((group) => group.items)

      if (allItems.length) {
        const firstMatchingItem = allItems[0]!
        updateSelectedItem(firstMatchingItem)
      }
    }
  }, [groups, updateSelectedItem, matchingString])

  useEffect(() => {
    setSelectedItemKeyToFirstMatchingItem()
  }, [matchingString, setSelectedItemKeyToFirstMatchingItem])

  const selectItemAndCleanUp = useCallback(
    (selectedItem: SlashMenuItem) => {
      close()

      editor.update(() => {
        const textNodeContainingQuery =
          resolution.match != null && shouldSplitNodeWithQuery
            ? $splitNodeContainingQuery(resolution.match)
            : null

        if (textNodeContainingQuery) {
          textNodeContainingQuery.remove()
        }
      })

      setTimeout(() => {
        // Needed in Firefox. See https://github.com/payloadcms/payload/issues/10724
        let selection: BaseSelection | undefined
        editor.read(() => {
          selection = $getSelection()?.clone()
        })
        editor.update(() => {
          if (selection) {
            $setSelection(selection)
          }
        })

        selectedItem.onSelect({
          editor,
          queryString: resolution.match ? resolution.match.matchingString : '',
        })
      }, 0)
    },
    [editor, shouldSplitNodeWithQuery, resolution.match, close],
  )

  useEffect(() => {
    return () => {
      const rootElem = editor.getRootElement()
      if (rootElem !== null) {
        rootElem.removeAttribute('aria-activedescendant')
      }
    }
  }, [editor])

  useLayoutEffect(() => {
    if (groups === null) {
      setSelectedItemKey(null)
    } else if (selectedItemKey === null) {
      setSelectedItemKeyToFirstMatchingItem()
    }
  }, [groups, selectedItemKey, updateSelectedItem, setSelectedItemKeyToFirstMatchingItem])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND,
        ({ item }) => {
          if (item.ref && item.ref.current != null) {
            scrollIntoViewIfNeeded(item.ref.current)
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateSelectedItem])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_DOWN_COMMAND,
        (payload) => {
          const event = payload
          if (groups !== null && groups.length && selectedItemKey !== null) {
            const allItems = groups.flatMap((group) => group.items)
            const selectedIndex = allItems.findIndex((item) => item.key === selectedItemKey)

            const newSelectedIndex = selectedIndex !== allItems.length - 1 ? selectedIndex + 1 : 0

            const newSelectedItem = allItems[newSelectedIndex]
            if (!newSelectedItem) {
              return false
            }

            updateSelectedItem(newSelectedItem)
            if (newSelectedItem.ref != null && newSelectedItem.ref.current) {
              editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {
                index: newSelectedIndex,
                item: newSelectedItem,
              })
            }
            event.preventDefault()
            event.stopImmediatePropagation()
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_UP_COMMAND,
        (payload) => {
          const event = payload
          if (groups !== null && groups.length && selectedItemKey !== null) {
            const allItems = groups.flatMap((group) => group.items)
            const selectedIndex = allItems.findIndex((item) => item.key === selectedItemKey)

            const newSelectedIndex = selectedIndex !== 0 ? selectedIndex - 1 : allItems.length - 1

            const newSelectedItem = allItems[newSelectedIndex]
            if (!newSelectedItem) {
              return false
            }

            updateSelectedItem(newSelectedItem)
            if (newSelectedItem.ref != null && newSelectedItem.ref.current) {
              scrollIntoViewIfNeeded(newSelectedItem.ref.current)
            }
            event.preventDefault()
            event.stopImmediatePropagation()
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ESCAPE_COMMAND,
        (payload) => {
          const event = payload
          event.preventDefault()
          event.stopImmediatePropagation()
          close()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_TAB_COMMAND,
        (payload) => {
          const event = payload

          if (groups === null || selectedItemKey === null) {
            return false
          }
          const allItems = groups.flatMap((group) => group.items)
          const selectedItem = allItems.find((item) => item.key === selectedItemKey)
          if (!selectedItem) {
            return false
          }

          event.preventDefault()
          event.stopImmediatePropagation()
          selectItemAndCleanUp(selectedItem)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent | null) => {
          if (groups === null || selectedItemKey === null) {
            return false
          }
          const allItems = groups.flatMap((group) => group.items)
          const selectedItem = allItems.find((item) => item.key === selectedItemKey)
          if (!selectedItem) {
            return false
          }

          if (event !== null) {
            event.preventDefault()
            event.stopImmediatePropagation()
          }
          selectItemAndCleanUp(selectedItem)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [selectItemAndCleanUp, close, editor, groups, selectedItemKey, updateSelectedItem])

  const listItemProps = useMemo(
    () => ({
      groups,
      selectedItemKey,
      selectItemAndCleanUp,
      setSelectedItemKey,
    }),
    [selectItemAndCleanUp, selectedItemKey, groups],
  )

  return menuRenderFn(
    anchorElementRef,
    listItemProps,
    resolution.match ? resolution.match.matchingString : '',
  )
}

function setContainerDivAttributes(containerDiv: HTMLElement, className?: string) {
  if (className != null) {
    containerDiv.className = className
  }
  containerDiv.setAttribute('aria-label', 'Slash menu')
  containerDiv.setAttribute('role', 'listbox')
  containerDiv.style.display = 'block'
  containerDiv.style.position = 'absolute'
}

export function useMenuAnchorRef(
  anchorElem: HTMLElement,
  resolution: MenuResolution | null,
  setResolution: (r: MenuResolution | null) => void,
  className?: string,
): RefObject<HTMLElement | null> {
  const [editor] = useLexicalComposerContext()
  const anchorElementRef = useRef<HTMLElement | null>(
    CAN_USE_DOM ? document.createElement('div') : null,
  )
  const positionMenu = useCallback(() => {
    if (anchorElementRef.current === null || parent === undefined) {
      return
    }
    const rootElement = editor.getRootElement()
    const containerDiv = anchorElementRef.current

    const VERTICAL_OFFSET = 32

    const menuEle = containerDiv.firstChild as Element
    if (rootElement !== null && resolution !== null) {
      const { height, width } = resolution.getRect()
      let { left, top } = resolution.getRect()

      const rawTop = top
      top -= anchorElem.getBoundingClientRect().top + window.scrollY
      left -= anchorElem.getBoundingClientRect().left + window.scrollX
      containerDiv.style.left = `${left + window.scrollX}px`
      containerDiv.style.height = `${height}px`
      containerDiv.style.width = `${width}px`
      if (menuEle !== null) {
        const menuRect = menuEle.getBoundingClientRect()
        const menuHeight = menuRect.height
        const menuWidth = menuRect.width

        const rootElementRect = rootElement.getBoundingClientRect()

        if (left + menuWidth > rootElementRect.right) {
          containerDiv.style.left = `${rootElementRect.right - menuWidth + window.scrollX}px`
        }

        const wouldGoOffBottomOfScreen = rawTop + menuHeight + VERTICAL_OFFSET > window.innerHeight
        //const wouldGoOffBottomOfContainer = top + menuHeight > rootElementRect.bottom
        const wouldGoOffTopOfScreen = rawTop < 0

        // Position slash menu above the cursor instead of below (default) if it would otherwise go off the bottom of the screen.
        if (wouldGoOffBottomOfScreen && !wouldGoOffTopOfScreen) {
          const margin = 24
          containerDiv.style.top = `${
            top + VERTICAL_OFFSET - menuHeight + window.scrollY - (height + margin)
          }px`
        } else {
          containerDiv.style.top = `${top + window.scrollY + VERTICAL_OFFSET}px`
        }
      }

      if (!containerDiv.isConnected) {
        setContainerDivAttributes(containerDiv, className)
        anchorElem.append(containerDiv)
      }
      containerDiv.setAttribute('id', 'slash-menu')
      anchorElementRef.current = containerDiv
      rootElement.setAttribute('aria-controls', 'slash-menu')
    }
  }, [editor, resolution, className, anchorElem])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (resolution !== null) {
      positionMenu()
      return () => {
        if (rootElement !== null) {
          rootElement.removeAttribute('aria-controls')
        }

        const containerDiv = anchorElementRef.current
        if (containerDiv !== null && containerDiv.isConnected) {
          containerDiv.remove()
          containerDiv.removeAttribute('id')
        }
      }
    }
  }, [editor, positionMenu, resolution])

  const onVisibilityChange = useCallback(
    (isInView: boolean) => {
      if (resolution !== null) {
        if (!isInView) {
          setResolution(null)
        }
      }
    },
    [resolution, setResolution],
  )

  useDynamicPositioning(resolution, anchorElementRef, positionMenu, onVisibilityChange)

  return anchorElementRef
}
