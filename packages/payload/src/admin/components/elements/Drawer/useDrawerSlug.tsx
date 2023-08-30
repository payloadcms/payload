import { useId } from 'react'

import { useEditDepth } from '../../utilities/EditDepth/index.js'
import { formatDrawerSlug } from './index.js'

export const useDrawerSlug = (slug: string): string => {
  const uuid = useId()
  const editDepth = useEditDepth()
  return formatDrawerSlug({
    depth: editDepth,
    slug: `${slug}-${uuid}`,
  })
}
