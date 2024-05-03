'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { CodeIcon } from '../../../lexical/ui/icons/Code/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarFormatGroupWithItems } from '../shared/inlineToolbarFormatGroup.js'
import { INLINE_CODE } from './markdownTransformers.js'

const InlineCodeFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        markdownTransformers: [INLINE_CODE],

        toolbarInline: {
          groups: [
            inlineToolbarFormatGroupWithItems([
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
          ],
        },
      }
    },
  }
}

export const InlineCodeFeatureClientComponent = createClientComponent(InlineCodeFeatureClient)
