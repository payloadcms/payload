import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { StrikethroughIcon } from '../../../lexical/ui/icons/Strikethrough'
import { STRIKETHROUGH } from './markdownTransformers'

export const StrikethroughTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: StrikethroughIcon,
                isActive: (editor, selection) => selection.hasFormat('strikethrough'),
                key: 'strikethrough',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
                },
                order: 4,
              },
            ],
          },
        },
        markdownTransformers: [STRIKETHROUGH],
      }
    },
    key: 'strikethrough',
  }
}
