import { useId } from 'react'

import { formatDrawerSlug } from '.'
import { useEditDepth } from '../../providers/EditDepth'

export const useDrawerSlug = (slug: string): string => {
  const uuid = useId()
  const editDepth = useEditDepth()
  return formatDrawerSlug({
    depth: editDepth,
    slug: `${slug}-${uuid}`,
  })
}
