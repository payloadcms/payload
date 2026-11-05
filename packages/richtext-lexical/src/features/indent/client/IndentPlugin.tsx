import type { ElementNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $addUpdateTag,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  TabNode,
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../typesClient.js'
import type { IndentFeatureProps } from '../server/index.js'

export const IndentPlugin: PluginComponent<IndentFeatureProps> = ({ clientProps }) => {
  const [editor] = useLexicalComposerContext()
  const { disabledNodes, disableTabNode } = clientProps

  useEffect(() => {
    let canTabOut = false
    let hasTabbedOut = false
    const resetTabExit = () => {
      canTabOut = false
    }
    let restoreTabIndexes: (() => void) | undefined
    let restoreTabTimer: ReturnType<typeof setTimeout> | undefined
    let rootEvents: AbortController | undefined

    function resetKeyboardExit() {
      resetTabExit()
      hasTabbedOut = false
    }

    function handleKeyDownCapture(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !canTabOut) {
        if (!['Escape', 'Shift', 'Tab'].includes(event.key)) {
          resetTabExit()
        }
        return
      }

      const root = editor.getRootElement()

      if (!root) {
        return
      }
      resetTabExit()
      hasTabbedOut = true
      event.stopPropagation()
      restoreTabIndexes?.()
      clearTimeout(restoreTabTimer)

      const container = root.closest('.rich-text-lexical') ?? root
      const tabStops = new Set([
        root,
        ...container.querySelectorAll<HTMLElement>(
          '[tabindex], [contenteditable="true"], a[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls]',
        ),
      ])
      const tabIndexes = new Map<HTMLElement, null | string>()

      // Let the browser take Tab outside the entire editor, including decorator controls.
      // Restore its tab stops after the native focus move so ordinary Tab navigation is unchanged.
      for (const element of tabStops) {
        tabIndexes.set(element, element.getAttribute('tabindex'))
        element.setAttribute('tabindex', '-1')
      }
      restoreTabIndexes = () => {
        for (const [element, tabIndex] of tabIndexes) {
          if (tabIndex === null) {
            element.removeAttribute('tabindex')
          } else {
            element.setAttribute('tabindex', tabIndex)
          }
        }
        restoreTabIndexes = undefined
      }
      restoreTabTimer = setTimeout(() => restoreTabIndexes?.(), 0)
      editor.update(() => $addUpdateTag(SKIP_DOM_SELECTION_TAG))
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented && editor.isEditable()) {
        // A second press can dismiss the containing drawer; holding Escape must not.
        if (canTabOut && !event.repeat) {
          return
        }
        // Menus handle Escape first. This also reaches inputs inside decorator blocks.
        event.preventDefault()
        event.stopPropagation()
        canTabOut = true
      }
    }

    const unregisterRootListener = editor.registerRootListener((root) => {
      rootEvents?.abort()
      rootEvents = new AbortController()
      const { signal } = rootEvents

      /* eslint-disable @eslint-react/web-api/no-leaked-event-listener -- Aborted on root replacement and effect cleanup. */
      root?.addEventListener('pointerdown', resetKeyboardExit, { signal })
      root?.addEventListener('keydown', handleKeyDownCapture, { capture: true, signal })
      root?.addEventListener('keydown', handleKeyDown, { signal })
      /* eslint-enable @eslint-react/web-api/no-leaked-event-listener */
    })

    const unregisterCommands = mergeRegister(
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (!editor.isEditable()) {
            return false
          }
          handleKeyDown(event)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        () => {
          const selection = $getSelection()
          const isRootSelection =
            $isRangeSelection(selection) &&
            selection.isCollapsed() &&
            $isRootOrShadowRoot(selection.anchor.getNode())

          // A root selection between decorator blocks has no text block to indent.
          if (!isRootSelection) {
            return false
          }
          resetTabExit()
          hasTabbedOut = true
          $addUpdateTag(SKIP_DOM_SELECTION_TAG)
          return true
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          resetTabExit()
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          resetKeyboardExit()
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const root = editor.getRootElement()

          // A delayed selectionchange must not reclaim focus after native Tab navigation.
          if (hasTabbedOut && root?.ownerDocument.activeElement !== root) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG)
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )

    return () => {
      unregisterCommands()
      unregisterRootListener()
      rootEvents?.abort()
      clearTimeout(restoreTabTimer)
      restoreTabIndexes?.()
    }
  }, [editor])

  useEffect(() => {
    if (!editor || !disabledNodes?.length) {
      return
    }
    return mergeRegister(
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentAndOutdent((block) => {
            if (!disabledNodes.includes(block.getType())) {
              const indent = block.getIndent()
              block.setIndent(indent + 1)
            }
          })
        },
        COMMAND_PRIORITY_LOW,
      ),
      // If we disable indenting for certain nodes, we need to ensure that these are not indented,
      // if they get transformed from an indented state (e.g. an indented list node gets transformed into a
      // paragraph node for which indenting is disabled).
      editor.registerUpdateListener(({ dirtyElements, editorState }) => {
        editor.update(() => {
          for (const [nodeKey] of dirtyElements) {
            const node = editorState._nodeMap.get(nodeKey)
            if ($isElementNode(node) && disabledNodes.includes(node.getType())) {
              const currentIndent = node.getIndent()
              if (currentIndent > 0) {
                node.setIndent(0)
              }
            }
          }
        })
      }),
    )
  }, [editor, disabledNodes])

  useEffect(() => {
    if (!editor || !disableTabNode) {
      return
    }
    return mergeRegister(
      // This is so that when you press Tab in the middle of a paragraph,
      // it indents the paragraph, instead of inserting a TabNode.
      editor.registerCommand<KeyboardEvent>(
        KEY_TAB_COMMAND,
        (event) => {
          event.preventDefault()
          return editor.dispatchCommand(
            event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
            undefined,
          )
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Tab isn't the only way to insert a TabNode. We have to make sure
      // it doesn't happen, for example, when pasting from the clipboard.
      editor.registerNodeTransform(TabNode, (node) => {
        node.remove()
      }),
    )
  }, [editor, disableTabNode])

  return <TabIndentationPlugin />
}

function $handleIndentAndOutdent(indentOrOutdent: (block: ElementNode) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return false
  }
  const alreadyHandled = new Set()
  const nodes = selection.getNodes()
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const key = node.getKey()
    if (alreadyHandled.has(key)) {
      continue
    }
    const parentBlock = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode =>
        $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (parentBlock === null) {
      continue
    }
    const parentKey = parentBlock.getKey()
    if (parentBlock.canIndent() && !alreadyHandled.has(parentKey)) {
      alreadyHandled.add(parentKey)
      indentOrOutdent(parentBlock)
    }
  }
  return alreadyHandled.size > 0
}
