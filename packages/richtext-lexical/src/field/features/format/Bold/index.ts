import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { BoldIcon } from '../../../lexical/ui/icons/Bold'
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
          buttons: {
            format: [
              {
                ChildComponent: BoldIcon,
                isActive: (editor, selection) => selection.hasFormat('bold'),
                key: 'bold',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                },
              },
            ],
          },
        },
        markdownTransformers: markdownTransformers,
      }
    },
    key: 'bold',
  }
}
