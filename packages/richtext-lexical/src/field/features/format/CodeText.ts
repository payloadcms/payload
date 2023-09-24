import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { CodeIcon } from '../../lexical/ui/icons/Code'

export const CodeTextFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        floatingSelectToolbar: {
          buttons: {
            format: [
              {
                ChildComponent: CodeIcon,
                isActive: (editor, selection) => selection.hasFormat('code'),
                key: 'code',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
                },
              },
            ],
          },
        },
      }
    },
    key: 'code',
  }
}
