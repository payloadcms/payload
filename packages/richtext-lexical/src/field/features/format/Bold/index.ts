import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
} from './markdownTransformers'

export const BoldTextFeature = (): FeatureProvider => {
  return {
    dependenciesSoft: ['italic'],
    feature: ({ featureProviderMap }) => {
      const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
      if (featureProviderMap.get('italic')) {
        markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
      }

      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Bold').then((module) => module.BoldIcon),
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
        markdownTransformers: markdownTransformers,
        props: null,
      }
    },
    key: 'bold',
  }
}
