import type { NavProps as UINavProps } from '@payloadcms/ui/elements/Nav'

import { DefaultNav as UIDefaultNav } from '@payloadcms/ui/elements/Nav'
import React from 'react'

import { getNavPrefs } from './getNavPrefs.js'
export type NavProps = UINavProps

export const DefaultNav: React.FC<NavProps> = async (props) => {
  const navPreferences = await getNavPrefs(props.req)

  return <UIDefaultNav {...props} navPreferences={navPreferences} />
}
