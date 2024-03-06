'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { StrikethroughIcon } from '../../../lexical/ui/icons/Strikethrough/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

const StrikethroughFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,

        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: StrikethroughIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('strikethrough')
                  }
                  return false
                },
                key: 'strikethrough',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
                },
                order: 4,
              },
            ]),
          ],
        },
        markdownTransformers: [STRIKETHROUGH],
      }
    },
  }
}

export const StrikethroughFeatureClientComponent = createClientComponent(StrikethroughFeatureClient)
