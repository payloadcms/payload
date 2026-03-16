import type { ArrayField, Field } from 'payload'

import { deepMerge } from '@/utils/deepMerge'
import { link, type LinkAppearances } from './link'

type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  overrides?: Partial<ArrayField>
}) => Field

export const linkGroup: LinkGroupType = ({ appearances, overrides = {} } = {}) => {
  const generatedLinkGroup: Field = {
    name: 'links',
    type: 'array',
    fields: [
      link({
        appearances,
      }),
    ],
    admin: {
      initCollapsed: true,
    },
  }

  return deepMerge(generatedLinkGroup, overrides)
}
