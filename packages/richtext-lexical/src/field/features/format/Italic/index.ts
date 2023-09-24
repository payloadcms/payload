import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { ItalicIcon } from '../../../lexical/ui/icons/Italic'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers'

export const ItalicTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: ItalicIcon,
                isActive: (editor, selection) => selection.hasFormat('italic'),
                key: 'italic',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
                },
                order: 2,
              },
            ],
          },
        },
        markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
      }
    },
    key: 'italic',
  }
}
