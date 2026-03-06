'use client'

import type { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import type { ElementFormatType, ElementNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { $findMatchingParent } from '@lexical/utils'
import {
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { AlignCenterIcon } from '../../../lexical/ui/icons/AlignCenter/index.js'
import { AlignJustifyIcon } from '../../../lexical/ui/icons/AlignJustify/index.js'
import { AlignLeftIcon } from '../../../lexical/ui/icons/AlignLeft/index.js'
import { AlignRightIcon } from '../../../lexical/ui/icons/AlignRight/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarAlignGroupWithItems } from './toolbarAlignGroup.js'

// DecoratorBlockNode has format, but Lexical forgot
// to add the getters like ElementNode does.
const getFormatType = (node: DecoratorBlockNode | ElementNode): ElementFormatType => {
  if ($isElementNode(node)) {
    return node.getFormatType()
  }
  return node.__format
}

const toolbarGroups: ToolbarGroup[] = [
  toolbarAlignGroupWithItems([
    {
      ChildComponent: AlignLeftIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isElementNode(node) || $isDecoratorBlockNode(node)) {
            if (getFormatType(node) === 'left') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent) || $isDecoratorBlockNode(parent)) {
            if (getFormatType(parent) === 'left') {
              continue
            }
          }

          return false
        }
        return true
      },
      key: 'alignLeft',
      label: ({ i18n }) => {
        return i18n.t('lexical:align:alignLeftLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
      },
      order: 1,
    },
    {
      ChildComponent: AlignCenterIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isElementNode(node) || $isDecoratorBlockNode(node)) {
            if (getFormatType(node) === 'center') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent) || $isDecoratorBlockNode(parent)) {
            if (getFormatType(parent) === 'center') {
              continue
            }
          }

          return false
        }
        return true
      },
      key: 'alignCenter',
      label: ({ i18n }) => {
        return i18n.t('lexical:align:alignCenterLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
      },
      order: 2,
    },
    {
      ChildComponent: AlignRightIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isElementNode(node) || $isDecoratorBlockNode(node)) {
            if (getFormatType(node) === 'right') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent) || $isDecoratorBlockNode(parent)) {
            if (getFormatType(parent) === 'right') {
              continue
            }
          }

          return false
        }
        return true
      },
      key: 'alignRight',
      label: ({ i18n }) => {
        return i18n.t('lexical:align:alignRightLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
      },
      order: 3,
    },
    {
      ChildComponent: AlignJustifyIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isElementNode(node) || $isDecoratorBlockNode(node)) {
            if (getFormatType(node) === 'justify') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent) || $isDecoratorBlockNode(parent)) {
            if (getFormatType(parent) === 'justify') {
              continue
            }
          }

          return false
        }
        return true
      },
      key: 'alignJustify',
      label: ({ i18n }) => {
        return i18n.t('lexical:align:alignJustifyLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
      },
      order: 4,
    },
  ]),
]

const AlignPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Just like the default Lexical configuration, but in
    // addition to ElementNode we also set DecoratorBlocks
    return editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      (format) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) && !$isNodeSelection(selection)) {
          return false
        }
        const nodes = selection.getNodes()
        for (const node of nodes) {
          const element = $findMatchingParent(
            node,
            (parentNode): parentNode is DecoratorBlockNode | ElementNode =>
              ($isElementNode(parentNode) || $isDecoratorBlockNode(parentNode)) &&
              !parentNode.isInline(),
          )
          if (element !== null) {
            element.setFormat(format)
          }
        }
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])
  return null
}

export const AlignFeatureClient = createClientFeature({
  plugins: [
    {
      Component: AlignPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
