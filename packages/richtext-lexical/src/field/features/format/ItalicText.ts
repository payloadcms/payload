import type { Feature } from '../types'

import { ItalicIcon } from '../../lexical/ui/icons/Italic'

export function ItalicTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: ItalicIcon,
          },
        ],
      },
    },
  }
}
