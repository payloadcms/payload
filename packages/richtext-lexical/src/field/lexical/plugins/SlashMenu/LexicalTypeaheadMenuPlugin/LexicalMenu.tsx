'use client'
import type { LexicalCommand, LexicalEditor, TextNode } from 'lexical'
import type { MutableRefObject, ReactPortal } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  createCommand,
} from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { MenuTextMatch } from '../useMenuTriggerMatch'
import type { SlashMenuOption } from './types'
import type { SlashMenuGroup } from './types'

export type MenuResolution = {
  getRect: () => DOMRect
  match?: MenuTextMatch
}

const baseClass = 'slash-menu-popup'

export type MenuRenderFn = (
  anchorElementRef: MutableRefObject<HTMLElement | null>,
  itemProps: {
    groupsWithOptions: Array<SlashMenuGroup>
    selectOptionAndCleanUp: (selectedOption: SlashMenuOption) => void
    selectedOptionKey: null | string
    setSelectedOptionKey: (optionKey: string) => void
  },
  matchingString: null | string,
) => JSX.Element | ReactPortal | null

const scrollIntoViewIfNeeded = (target: HTMLElement) => {
  const typeaheadContainerNode = document.getElementById('slash-menu')
  if (!typeaheadContainerNode) return

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
function getFullMatchOffset(documentText: string, entryText: string, offset: number): number {
  let triggerOffset = offset
  for (let i = triggerOffset; i <= entryText.length; i++) {
    if (documentText.substr(-i) === entryText.substr(0, i)) {
      triggerOffset = i
    }
  }
  return triggerOffset
}

/**
 * Split Lexical TextNode and return a new TextNode only containing matched text.
 * Common use cases include: removing the node, replacing with a new node.
 */
function $splitNodeContainingQuery(match: MenuTextMatch): TextNode | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null
  }
  const anchor = selection.anchor
  if (anchor.type !== 'text') {
    return null
  }
  const anchorNode = anchor.getNode()
  if (!anchorNode.isSimpleText()) {
    return null
  }
  const selectionOffset = anchor.offset
  const textContent = anchorNode.getTextContent().slice(0, selectionOffset)
  // eslint-disable-next-line react/destructuring-assignment
  const characterOffset = match.replaceableString.length
  // eslint-disable-next-line react/destructuring-assignment
  const queryOffset = getFullMatchOffset(textContent, match.matchingString, characterOffset)
  const startOffset = selectionOffset - queryOffset
  if (startOffset < 0) {
    return null
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
  targetElement: HTMLElement | null,
  onReposition: () => void,
  onVisibilityChange?: (isInView: boolean) => void,
) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
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
        resizeObserver.unobserve(targetElement)
        window.removeEventListener('resize', onReposition)
        document.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [targetElement, editor, onVisibilityChange, onReposition, resolution])
}

export const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND: LexicalCommand<{
  index: number
  option: SlashMenuOption
}> = createCommand('SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND')

export function LexicalMenu({
  anchorElementRef,
  close,
  editor,
  // groupsWithOptions filtering is already handled in SlashMenu/index.tsx. Thus, groupsWithOptions always contains the matching options.
  groupsWithOptions,
  menuRenderFn,
  onSelectOption,
  resolution,
  shouldSplitNodeWithQuery = false,
}: {
  anchorElementRef: MutableRefObject<HTMLElement>
  close: () => void
  editor: LexicalEditor
  groupsWithOptions: Array<SlashMenuGroup>
  menuRenderFn: MenuRenderFn
  onSelectOption: (
    option: SlashMenuOption,
    textNodeContainingQuery: TextNode | null,
    closeMenu: () => void,
    matchingString: string,
  ) => void
  resolution: MenuResolution
  shouldSplitNodeWithQuery?: boolean
}): JSX.Element | null {
  const [selectedOptionKey, setSelectedOptionKey] = useState<null | string>(null)

  const matchingString = (resolution.match && resolution.match.matchingString) || ''

  const updateSelectedOption = useCallback(
    (option: SlashMenuOption) => {
      const rootElem = editor.getRootElement()
      if (rootElem !== null) {
        rootElem.setAttribute('aria-activedescendant', `${baseClass}__item-${option.key}`)
        setSelectedOptionKey(option.key)
      }
    },
    [editor],
  )

  const setSelectedOptionKeyToFirstMatchingOption = useCallback(() => {
    // set selected option to the first of the matching ones
    if (groupsWithOptions !== null && matchingString != null) {
      // groupsWithOptions filtering is already handled in SlashMenu/index.tsx. Thus, groupsWithOptions always contains the matching options.
      const allOptions = groupsWithOptions.flatMap((group) => group.options)

      if (allOptions.length) {
        const firstMatchingOption = allOptions[0]
        updateSelectedOption(firstMatchingOption)
      }
    }
  }, [groupsWithOptions, updateSelectedOption, matchingString])

  useEffect(() => {
    setSelectedOptionKeyToFirstMatchingOption()
  }, [matchingString, setSelectedOptionKeyToFirstMatchingOption])

  const selectOptionAndCleanUp = useCallback(
    (selectedOption: SlashMenuOption) => {
      editor.update(() => {
        const textNodeContainingQuery =
          resolution.match != null && shouldSplitNodeWithQuery
            ? $splitNodeContainingQuery(resolution.match)
            : null

        onSelectOption(
          selectedOption,
          textNodeContainingQuery,
          close,
          resolution.match ? resolution.match.matchingString : '',
        )
      })
    },
    [editor, shouldSplitNodeWithQuery, resolution.match, onSelectOption, close],
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
    if (groupsWithOptions === null) {
      setSelectedOptionKey(null)
    } else if (selectedOptionKey === null) {
      setSelectedOptionKeyToFirstMatchingOption()
    }
  }, [
    groupsWithOptions,
    selectedOptionKey,
    updateSelectedOption,
    setSelectedOptionKeyToFirstMatchingOption,
  ])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND,
        ({ option }) => {
          if (option.ref && option.ref.current != null) {
            scrollIntoViewIfNeeded(option.ref.current)
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateSelectedOption])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_DOWN_COMMAND,
        (payload) => {
          const event = payload
          if (
            groupsWithOptions !== null &&
            groupsWithOptions.length &&
            selectedOptionKey !== null
          ) {
            const allOptions = groupsWithOptions.flatMap((group) => group.options)
            const selectedIndex = allOptions.findIndex((option) => option.key === selectedOptionKey)

            const newSelectedIndex = selectedIndex !== allOptions.length - 1 ? selectedIndex + 1 : 0

            const newSelectedOption = allOptions[newSelectedIndex]

            updateSelectedOption(newSelectedOption)
            if (newSelectedOption.ref != null && newSelectedOption.ref.current) {
              editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {
                index: newSelectedIndex,
                option: newSelectedOption,
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
          if (
            groupsWithOptions !== null &&
            groupsWithOptions.length &&
            selectedOptionKey !== null
          ) {
            const allOptions = groupsWithOptions.flatMap((group) => group.options)
            const selectedIndex = allOptions.findIndex((option) => option.key === selectedOptionKey)

            const newSelectedIndex = selectedIndex !== 0 ? selectedIndex - 1 : allOptions.length - 1

            const newSelectedOption = allOptions[newSelectedIndex]

            updateSelectedOption(newSelectedOption)
            if (newSelectedOption.ref != null && newSelectedOption.ref.current) {
              scrollIntoViewIfNeeded(newSelectedOption.ref.current)
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

          if (groupsWithOptions === null || selectedOptionKey === null) {
            return false
          }
          const allOptions = groupsWithOptions.flatMap((group) => group.options)
          const selectedOption = allOptions.find((option) => option.key === selectedOptionKey)
          if (!selectedOption) {
            return false
          }

          event.preventDefault()
          event.stopImmediatePropagation()
          selectOptionAndCleanUp(selectedOption)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent | null) => {
          if (groupsWithOptions === null || selectedOptionKey === null) {
            return false
          }
          const allOptions = groupsWithOptions.flatMap((group) => group.options)
          const selectedOption = allOptions.find((option) => option.key === selectedOptionKey)
          if (!selectedOption) {
            return false
          }

          if (event !== null) {
            event.preventDefault()
            event.stopImmediatePropagation()
          }
          selectOptionAndCleanUp(selectedOption)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [
    selectOptionAndCleanUp,
    close,
    editor,
    groupsWithOptions,
    selectedOptionKey,
    updateSelectedOption,
  ])

  const listItemProps = useMemo(
    () => ({
      groupsWithOptions,
      selectOptionAndCleanUp,
      selectedOptionKey,
      setSelectedOptionKey,
    }),
    [selectOptionAndCleanUp, selectedOptionKey, groupsWithOptions],
  )

  return menuRenderFn(
    anchorElementRef,
    listItemProps,
    resolution.match ? resolution.match.matchingString : '',
  )
}

export function useMenuAnchorRef(
  anchorElem: HTMLElement,
  resolution: MenuResolution | null,
  setResolution: (r: MenuResolution | null) => void,
  className?: string,
): MutableRefObject<HTMLElement> {
  const [editor] = useLexicalComposerContext()
  const anchorElementRef = useRef<HTMLElement>(document.createElement('div'))
  const positionMenu = useCallback(() => {
    const rootElement = editor.getRootElement()
    const containerDiv = anchorElementRef.current

    const VERTICAL_OFFSET = 32 as const

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
        if (className != null) {
          containerDiv.className = className
        }
        containerDiv.setAttribute('aria-label', 'Slash menu')
        containerDiv.setAttribute('id', 'slash-menu')
        containerDiv.setAttribute('role', 'listbox')
        containerDiv.style.display = 'block'
        containerDiv.style.position = 'absolute'
        anchorElem.append(containerDiv)
      }
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

  useDynamicPositioning(resolution, anchorElementRef.current, positionMenu, onVisibilityChange)

  return anchorElementRef
}
