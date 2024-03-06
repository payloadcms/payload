'use client'
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { BoldIcon } from '../../../lexical/ui/icons/Bold/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection.js'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
} from './markdownTransformers.js'

const BoldFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
      if (featureProviderMap.get('italic')) {
        markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
      }

      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: BoldIcon,
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('bold')
                  }
                  return false
                },
                key: 'bold',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                },
                order: 1,
              },
            ]),
          ],
        },
        markdownTransformers,
      }
    },
  }
}

export const BoldFeatureClientComponent = createClientComponent(BoldFeatureClient)
