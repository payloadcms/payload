'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { SuperscriptIcon } from '../../../lexical/ui/icons/Superscript/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection.js'

const SuperscriptFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: SuperscriptIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('superscript')
                  }
                  return false
                },
                key: 'superscript',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
                },
                order: 6,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const SuperscriptFeatureClientComponent = createClientComponent(SuperscriptFeatureClient)
