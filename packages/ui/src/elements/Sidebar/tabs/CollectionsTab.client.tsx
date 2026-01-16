'use client'
import type { NavPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import type { NavGroupType } from '../../../utilities/groupNavItems.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { EntityType } from '../../../utilities/groupNavItems.js'
import { BrowseByFolderButton } from '../../FolderView/BrowseByFolderButton/index.js'
import { Link } from '../../Link/index.js'
import { NavGroup } from '../../NavGroup/index.js'

const baseClass = 'nav'

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
  const pathname = usePathname()
  const { i18n } = useTranslation()

  const {
    config: {
      admin: {
        routes: { browseByFolder: foldersRoute },
      },
      folders,
    },
  } = useConfig()

  const folderURL = formatAdminURL({
    adminRoute,
    path: foldersRoute,
  })

  const viewingRootFolderView = pathname.startsWith(folderURL)

  return (
    <Fragment>
      {folders && folders.browseByFolder && <BrowseByFolderButton active={viewingRootFolderView} />}
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup isOpen={navPreferences?.groups?.[label]?.open} key={key} label={label}>
            {entities.map(({ slug, type, label: entityLabel }, i) => {
              let href: string
              let id: string

              if (type === EntityType.collection) {
                href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
                id = `nav-${slug}`
              }

              if (type === EntityType.global) {
                href = formatAdminURL({ adminRoute, path: `/globals/${slug}` })
                id = `nav-global-${slug}`
              }

              const isActive =
                pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

              const Label = (
                <>
                  {isActive && <div className={`${baseClass}__link-indicator`} />}
                  <span className={`${baseClass}__link-label`}>
                    {getTranslation(entityLabel, i18n)}
                  </span>
                </>
              )

              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link`} id={id} key={i}>
                    {Label}
                  </div>
                )
              }

              return (
                <Link className={`${baseClass}__link`} href={href} id={id} key={i} prefetch={false}>
                  {Label}
                </Link>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
