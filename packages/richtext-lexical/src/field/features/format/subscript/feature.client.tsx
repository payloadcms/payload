'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { SubscriptIcon } from '../../../lexical/ui/icons/Subscript/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection.js'

const SubscriptFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: SubscriptIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('subscript')
                  }
                  return false
                },
                key: 'subscript',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
                },
                order: 5,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const SubscriptFeatureClientComponent = createClientComponent(SubscriptFeatureClient)
