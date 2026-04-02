'use client'

import type { NavPreferences } from 'payload'

import React from 'react'

import type { groupNavItems } from '../../utilities/groupNavItems.js'

import { AdminNavLinks } from './AdminNavLinks.js'

/**
 * @internal
 */
export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>
  navPreferences: NavPreferences
}> = ({ groups, navPreferences }) => {
  return <AdminNavLinks groups={groups} navPreferences={navPreferences} />
}
