import type { Feature } from '../types'

import { StrikethroughIcon } from '../../lexical/ui/icons/Strikethrough'

export function StrikethroughTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: StrikethroughIcon,
          },
        ],
      },
    },
  }
}
