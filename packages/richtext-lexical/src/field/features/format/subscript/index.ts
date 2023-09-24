import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SubscriptIcon } from '../../../lexical/ui/icons/Subscript'

export const SubscriptTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: SubscriptIcon,
                isActive: (editor, selection) => selection.hasFormat('subscript'),
                key: 'subscript',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
                },
              },
            ],
          },
        },
      }
    },
    key: 'subscript',
  }
}
