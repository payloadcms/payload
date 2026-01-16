import type { NavPreferences } from 'payload'

import React from 'react'

import type { NavGroupType } from '../../../utilities/groupNavItems.js'

import { CollectionsTab as CollectionsTabClient } from './CollectionsTab.client.js'

export type CollectionsTabProps = {
  adminRoute: string
  groups: NavGroupType[]
  navPreferences: NavPreferences
}

export const CollectionsTab: React.FC<CollectionsTabProps> = ({
  adminRoute,
  groups,
  navPreferences,
}) => {
  return (
    <CollectionsTabClient adminRoute={adminRoute} groups={groups} navPreferences={navPreferences} />
  )
}
