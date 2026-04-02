'use client'

import type { groupNavItems } from '@payloadcms/ui/shared'
import type { NavPreferences } from 'payload'

import { AdminNavLinks } from '@payloadcms/ui'
import React from 'react'

/**
 * @internal
 */
export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>
  navPreferences: NavPreferences
}> = ({ groups, navPreferences }) => {
  return <AdminNavLinks groups={groups} navPreferences={navPreferences} />
}
