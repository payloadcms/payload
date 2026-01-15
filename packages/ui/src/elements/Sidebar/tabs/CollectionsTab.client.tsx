'use client'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { NavGroupType } from '../../../utilities/groupNavItems.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { EntityType } from '../../../utilities/groupNavItems.js'
import { Link } from '../../Link/index.js'
import { NavGroup } from '../../NavGroup/index.js'

export type CollectionsTabProps = {
  adminRoute: string
  groups: NavGroupType[]
}

export const CollectionsTab: React.FC<CollectionsTabProps> = ({ adminRoute, groups }) => {
  const { i18n } = useTranslation()

  return (
    <div className="sidebar-tabs__content">
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup key={key} label={label}>
            {entities.map(({ slug, type, label: entityLabel }, i) => {
              const href = formatAdminURL({
                adminRoute,
                path: type === EntityType.collection ? `/collections/${slug}` : `/globals/${slug}`,
              })

              return (
                <Link href={href} key={i}>
                  {getTranslation(entityLabel, i18n)}
                </Link>
              )
            })}
          </NavGroup>
        )
      })}
    </div>
  )
}
