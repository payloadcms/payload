import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { ItalicIcon } from '../../lexical/ui/icons/Italic'

export function ItalicTextFeature(): Feature {
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
          },
        ],
      },
    },
  }
}
