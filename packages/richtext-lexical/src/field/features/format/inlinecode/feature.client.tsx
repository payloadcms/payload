'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types'

import { CodeIcon } from '../../../lexical/ui/icons/Code'
import { createClientComponent } from '../../createClientComponent'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { INLINE_CODE } from './markdownTransformers'

const InlineCodeFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: CodeIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('code')
                  }
                  return false
                },
                key: 'code',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
                },
                order: 7,
              },
            ]),
          ],
        },

        markdownTransformers: [INLINE_CODE],
      }
    },
  }
}

export const InlineCodeFeatureClientComponent = createClientComponent(InlineCodeFeatureClient)
