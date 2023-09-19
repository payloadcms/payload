import type { Feature } from '../types'

import { SubscriptIcon } from '../../lexical/ui/icons/Subscript'

export function SubscriptTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: SubscriptIcon,
          },
        ],
      },
    },
  }
}
