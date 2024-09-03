'use client'

import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isParagraphNode, $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { TextIcon } from '../../../lexical/ui/icons/Text/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { slashMenuBasicGroupWithItems } from '../../shared/slashMenu/basicGroup.js'
import { toolbarTextDropdownGroupWithItems } from '../../shared/toolbar/textDropdownGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarTextDropdownGroupWithItems([
    {
      ChildComponent: TextIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if (!$isParagraphNode(node) && !$isParagraphNode(node.getParent())) {
            return false
          }
        }
        return true
      },
      key: 'paragraph',
      label: ({ i18n }) => {
        return i18n.t('lexical:paragraph:label2')
      },
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          $setBlocksType(selection, () => $createParagraphNode())
        })
      },
      order: 1,
    },
  ]),
]

export const ParagraphFeatureClient = createClientFeature({
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: TextIcon,
          key: 'paragraph',
          keywords: ['normal', 'paragraph', 'p', 'text'],
          label: ({ i18n }) => {
            return i18n.t('lexical:paragraph:label')
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              const selection = $getSelection()
              $setBlocksType(selection, () => $createParagraphNode())
            })
          },
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
