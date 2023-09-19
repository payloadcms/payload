import type { Feature } from '../types'

import { CodeIcon } from '../../lexical/ui/icons/Code'

export function CodeTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: CodeIcon,
          },
        ],
      },
    },
  }
}
