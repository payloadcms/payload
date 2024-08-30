'use client'
import { useId } from 'react'

import { useDrawerDepth } from '../../providers/DrawerDepth/index.js'
import { formatDrawerSlug } from './index.js'

export const useDrawerSlug = (slug: string): string => {
  const uuid = useId()
  const drawerDepth = useDrawerDepth()
  return formatDrawerSlug({
    slug: `${slug}-${uuid}`,
    depth: drawerDepth,
  })
}
