'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types'

import { UnderlineIcon } from '../../../lexical/ui/icons/Underline'
import { createClientComponent } from '../../createClientComponent'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

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
