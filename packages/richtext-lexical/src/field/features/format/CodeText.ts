import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { CodeIcon } from '../../lexical/ui/icons/Code'

export function CodeTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: CodeIcon,
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
}
