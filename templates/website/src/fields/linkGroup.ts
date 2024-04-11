import type { ArrayField } from 'payload/dist/fields/config/types'
import type { Field } from 'payload/types'

import type { LinkAppearances } from './link'

import deepMerge from '../utilities/deepMerge'
import link from './link'

type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  overrides?: Partial<ArrayField>
}) => Field

const linkGroup: LinkGroupType = ({ appearances, overrides = {} } = {}) => {
  const generatedLinkGroup: Field = {
    name: 'links',
    type: 'array',
    fields: [
      link({
        appearances,
      }),
    ],
  }

  return deepMerge(generatedLinkGroup, overrides)
}

export default linkGroup
