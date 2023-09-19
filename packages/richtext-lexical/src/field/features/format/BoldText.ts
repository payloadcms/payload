import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { BoldIcon } from '../../lexical/ui/icons/Bold'

export function BoldTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: BoldIcon,
            isActive: (editor, selection) => selection.hasFormat('bold'),
            key: 'bold',
            onClick: (editor) => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
            },
          },
        ],
      },
    },
  }
}
