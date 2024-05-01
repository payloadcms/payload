'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { UnderlineIcon } from '../../../lexical/ui/icons/Underline/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection.js'

const UnderlineFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: UnderlineIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('underline')
                  }
                  return false
                },
                key: 'underline',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                },
                order: 3,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const UnderlineFeatureClientComponent = createClientComponent(UnderlineFeatureClient)
