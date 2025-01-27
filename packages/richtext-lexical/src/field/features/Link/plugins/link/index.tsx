'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import type { LinkPayload } from '../floatingLinkEditor/types'

import { validateUrl } from '../../../../lexical/utils/url'
import { type LinkFields, LinkNode, TOGGLE_LINK_COMMAND, toggleLink } from '../../nodes/LinkNode'

export function LinkPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([LinkNode])) {
      throw new Error('LinkPlugin: LinkNode not registered on editor')
    }
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload: LinkPayload) => {
          // validate
          if (payload?.fields.linkType === 'custom') {
            if (!(validateUrl === undefined || validateUrl(payload?.fields.url))) {
              return false
            }
          }

          toggleLink(payload)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      validateUrl !== undefined
        ? editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
              const selection = $getSelection()
              if (
                !$isRangeSelection(selection) ||
                selection.isCollapsed() ||
                !(event instanceof ClipboardEvent) ||
                event.clipboardData == null
              ) {
                return false
              }
              const clipboardText = event.clipboardData.getData('text')
              if (!validateUrl(clipboardText)) {
                return false
              }
              // If we select nodes that are elements then avoid applying the link.
              if (!selection.getNodes().some((node) => $isElementNode(node))) {
                const linkFields: LinkFields = {
                  doc: null,
                  linkType: 'custom',
                  newTab: false,
                  url: clipboardText,
                }
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
                  fields: linkFields,
                  text: null,
                })
                event.preventDefault()
                return true
              }
              return false
            },
            COMMAND_PRIORITY_LOW,
          )
        : () => {
            // Don't paste arbitrary text as a link when there's no validate function
          },
    )
  }, [editor])

  return null
}
