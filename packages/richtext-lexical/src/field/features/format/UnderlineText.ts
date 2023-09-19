import type { Feature } from '../types'

import { UnderlineIcon } from '../../lexical/ui/icons/Underline'

export function UnderlineTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: UnderlineIcon,
          },
        ],
      },
    },
  }
}
