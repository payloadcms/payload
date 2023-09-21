import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { UnderlineIcon } from '../../lexical/ui/icons/Underline'

export function UnderlineTextFeature(): Feature {
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
}
