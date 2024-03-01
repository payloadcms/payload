'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types'

import { ItalicIcon } from '../../../lexical/ui/icons/Italic'
import { createClientComponent } from '../../createClientComponent'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers'

const ItalicFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,

        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: ItalicIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('italic')
                  }
                  return false
                },
                key: 'italic',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
                },
                order: 2,
              },
            ]),
          ],
        },
        markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
      }
    },
  }
}

export const ItalicFeatureClientComponent = createClientComponent(ItalicFeatureClient)
