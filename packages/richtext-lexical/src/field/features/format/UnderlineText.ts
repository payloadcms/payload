import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { UnderlineIcon } from '../../lexical/ui/icons/Underline'

export const UnderlineTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: UnderlineIcon,
                isActive: (editor, selection) => selection.hasFormat('underline'),
                key: 'underline',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                },
              },
            ],
          },
        },
      }
    },
    key: 'underline',
  }
}
