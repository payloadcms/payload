import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { StrikethroughIcon } from '../../lexical/ui/icons/Strikethrough'

export function StrikethroughTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            ChildComponent: StrikethroughIcon,
            isActive: (editor, selection) => selection.hasFormat('strikethrough'),
            key: 'strikethrough',
            onClick: (editor) => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
            },
          },
        ],
      },
    },
  }
}
