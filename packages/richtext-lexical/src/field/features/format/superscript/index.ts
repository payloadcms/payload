import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SuperscriptIcon } from '../../../lexical/ui/icons/Superscript'

export const SuperscriptTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: SuperscriptIcon,
                isActive: (editor, selection) => selection.hasFormat('superscript'),
                key: 'superscript',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
                },
              },
            ],
          },
        },
      }
    },
    key: 'superscript',
  }
}
