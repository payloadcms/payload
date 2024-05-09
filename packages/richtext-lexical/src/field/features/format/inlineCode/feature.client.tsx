'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { FeatureProviderProviderClient } from '../../types.js'

import { CodeIcon } from '../../../lexical/ui/icons/Code/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'
import { INLINE_CODE } from './markdownTransformers.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: CodeIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection)) {
          return selection.hasFormat('code')
        }
        return false
      },
      key: 'inlineCode',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
      },
      order: 7,
    },
  ]),
]

const InlineCodeFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        markdownTransformers: [INLINE_CODE],

        toolbarFixed: {
          groups: toolbarGroups,
        },
        toolbarInline: {
          groups: toolbarGroups,
        },
      }
    },
  }
}

export const InlineCodeFeatureClientComponent = createClientComponent(InlineCodeFeatureClient)
