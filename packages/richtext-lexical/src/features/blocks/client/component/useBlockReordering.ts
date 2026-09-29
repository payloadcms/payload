import type { LexicalEditor } from 'lexical'
import type { KeyboardEvent } from 'react'

import {
  $getNodeByKey,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  SKIP_DOM_SELECTION_TAG,
} from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export function useBlockReordering({
  editor,
  nodeKey,
}: {
  editor: LexicalEditor
  nodeKey: string
}) {
  const [targetIndex, setTargetIndex] = useState<null | number>(null)
  const targetRef = useRef<null | number>(null)
  const isPointerDownRef = useRef(false)
  const cancelAfterPointerRef = useRef(false)
  const isReordering = targetIndex !== null

  useEffect(
    () =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const target = event?.target

          // Leave Enter to the menu controls instead of editing the retained text selection.
          return (
            target instanceof HTMLElement &&
            Boolean(editor.getElementByKey(nodeKey)?.contains(target)) &&
            Boolean(target.closest('.collapsible__actions button'))
          )
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor, nodeKey],
  )

  useEffect(() => {
    if (!isReordering) {
      return
    }
    let cancelTimer: ReturnType<typeof setTimeout> | undefined
    const onPointerDown = () => {
      isPointerDownRef.current = true
    }
    const onPointerUp = () => {
      isPointerDownRef.current = false
      if (cancelAfterPointerRef.current) {
        // Let the click fire before restoring the preview's original positions.
        cancelTimer = setTimeout(() => {
          targetRef.current = null
          setTargetIndex(null)
        }, 0)
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerUp, true)
    document.addEventListener('pointercancel', onPointerUp, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerUp, true)
      document.removeEventListener('pointercancel', onPointerUp, true)
      clearTimeout(cancelTimer)
      isPointerDownRef.current = false
      cancelAfterPointerRef.current = false
    }
  }, [isReordering])

  useLayoutEffect(() => {
    if (targetIndex === null) {
      return
    }
    const restore: (() => void)[] = []

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey)
      const siblings = node?.getParent()?.getChildren()
      const currentIndex = node?.getIndexWithinParent()

      if (!siblings || currentIndex === undefined || currentIndex === targetIndex) {
        return
      }
      const elements = siblings.map((sibling) => editor.getElementByKey(sibling.getKey()))
      const source = elements[currentIndex]
      const target = elements[targetIndex]
      const adjacent = elements[currentIndex + (targetIndex > currentIndex ? 1 : -1)]

      if (!source || !target || !adjacent) {
        return
      }
      const sourceRect = source.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const adjacentRect = adjacent.getBoundingClientRect()
      const isMovingDown = targetIndex > currentIndex
      const sourceOffset = isMovingDown
        ? targetRect.bottom - sourceRect.bottom
        : targetRect.top - sourceRect.top
      const siblingOffset = isMovingDown
        ? sourceRect.top - adjacentRect.top
        : sourceRect.bottom - adjacentRect.bottom

      // Preview the pending order without committing an editor change until drop.
      for (
        let index = Math.min(currentIndex, targetIndex);
        index <= Math.max(currentIndex, targetIndex);
        index++
      ) {
        const element = elements[index]

        if (element) {
          const translate = element.style.translate

          restore.push(() => {
            element.style.translate = translate
          })
          element.style.translate = `0 ${index === currentIndex ? sourceOffset : siblingOffset}px`
        }
      }
      source.querySelector('.collapsible__drag')?.scrollIntoView({ block: 'nearest' })
    })

    return () => restore.forEach((reset) => reset())
  }, [editor, nodeKey, targetIndex])

  const move = useCallback(
    ({ direction, index }: { direction?: -1 | 1; index?: number }) => {
      if (!editor.isEditable()) {
        return
      }
      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey)
          const siblings = node?.getParent()?.getChildren()

          if (!node || !siblings) {
            return
          }
          const currentIndex = node.getIndexWithinParent()
          const destination = index ?? currentIndex + (direction ?? 0)
          const target = siblings[destination]

          if (target && target !== node) {
            if (destination < currentIndex) {
              target.insertBefore(node)
            } else {
              target.insertAfter(node)
            }
          }
        },
        {
          onUpdate: () => {
            // The block header is recreated when its row number changes.
            requestAnimationFrame(() => {
              const header = editor
                .getElementByKey(nodeKey)
                ?.querySelector('.collapsible__toggle-wrap')
              const focusTarget =
                header?.querySelector<HTMLElement>('.collapsible__drag') ??
                header?.querySelector<HTMLElement>('.LexicalEditorTheme__block__actions-button')

              focusTarget?.focus()
            })
          },
          tag: SKIP_DOM_SELECTION_TAG,
        },
      )
    },
    [editor, nodeKey],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!editor.isEditable()) {
        return
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        if (targetRef.current === null) {
          editor.getEditorState().read(() => {
            targetRef.current = $getNodeByKey(nodeKey)?.getIndexWithinParent() ?? null
          })
          setTargetIndex(targetRef.current)
        } else {
          move({ index: targetRef.current })
          targetRef.current = null
          setTargetIndex(null)
        }
      } else if (targetRef.current !== null) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          targetRef.current = null
          setTargetIndex(null)
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
          }
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault()
          event.stopPropagation()
          editor.getEditorState().read(() => {
            const count = $getNodeByKey(nodeKey)?.getParent()?.getChildrenSize() ?? 0
            targetRef.current = Math.max(
              0,
              Math.min(count - 1, (targetRef.current ?? 0) + (event.key === 'ArrowDown' ? 1 : -1)),
            )
          })
          setTargetIndex(targetRef.current)
        }
      }
    },
    [editor, move, nodeKey],
  )

  const onBlur = useCallback(() => {
    if (isPointerDownRef.current) {
      cancelAfterPointerRef.current = true
      return
    }
    targetRef.current = null
    setTargetIndex(null)
  }, [])

  return { isReordering, move, onBlur, onKeyDown, targetIndex }
}
