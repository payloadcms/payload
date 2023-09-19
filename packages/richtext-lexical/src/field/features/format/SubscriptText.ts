import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { SubscriptIcon } from '../../lexical/ui/icons/Subscript'

export function SubscriptTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: SubscriptIcon,
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
}
