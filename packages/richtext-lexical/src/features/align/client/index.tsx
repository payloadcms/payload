'use client'

import { $isElementNode, $isRangeSelection, FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { AlignCenterIcon } from '../../../lexical/ui/icons/AlignCenter/index.js'
import { AlignJustifyIcon } from '../../../lexical/ui/icons/AlignJustify/index.js'
import { AlignLeftIcon } from '../../../lexical/ui/icons/AlignLeft/index.js'
import { AlignRightIcon } from '../../../lexical/ui/icons/AlignRight/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarAlignGroupWithItems } from './toolbarAlignGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarAlignGroupWithItems([
    {
      ChildComponent: AlignLeftIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isElementNode(node)) {
            if (node.getFormatType() === 'left') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent)) {
            if (parent.getFormatType() === 'left') {
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
          if ($isElementNode(node)) {
            if (node.getFormatType() === 'center') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent)) {
            if (parent.getFormatType() === 'center') {
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
          if ($isElementNode(node)) {
            if (node.getFormatType() === 'right') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent)) {
            if (parent.getFormatType() === 'right') {
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
          if ($isElementNode(node)) {
            if (node.getFormatType() === 'justify') {
              continue
            }
          }

          const parent = node.getParent()
          if ($isElementNode(parent)) {
            if (parent.getFormatType() === 'justify') {
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

export const AlignFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
