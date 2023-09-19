import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { Feature } from '../types'

import { SuperscriptIcon } from '../../lexical/ui/icons/Superscript'

export function SuperscriptTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: SuperscriptIcon,
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
}
