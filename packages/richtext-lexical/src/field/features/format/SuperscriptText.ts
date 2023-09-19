import type { Feature } from '../types'

import { SuperscriptIcon } from '../../lexical/ui/icons/Superscript'

export function SuperscriptTextFeature(): Feature {
  return {
    floatingSelectToolbar: {
      buttons: {
        format: [
          {
            children: SuperscriptIcon,
          },
        ],
      },
    },
  }
}
