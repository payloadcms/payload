import type { Feature } from '../types'

import { BoldIcon } from '../../lexical/ui/icons/Bold'

export function BoldTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: BoldIcon,
          },
        ],
      },
    },
  }
}
