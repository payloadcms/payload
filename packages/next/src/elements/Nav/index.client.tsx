'use client'

import type { groupNavItems } from '@payloadcms/ui/shared'
import type { NavPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { NavGroup, useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType, formatAdminURL } from '@payloadcms/ui/shared'
import LinkWithDefault from 'next/link.js'
import { usePathname } from 'next/navigation.js'
import React, { Fragment } from 'react'

const baseClass = 'nav'

export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>
  navPreferences: NavPreferences
}> = ({ groups, navPreferences }) => {
  const pathname = usePathname()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup isOpen={navPreferences?.groups?.[label]?.open} key={key} label={label}>
            {entities.map(({ slug, type, label }, i) => {
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

              const Link = (LinkWithDefault.default ||
                LinkWithDefault) as typeof LinkWithDefault.default

              const LinkElement = Link || 'a'
              const activeCollection =
                pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

              return (
                <LinkElement
                  className={[`${baseClass}__link`, activeCollection && `active`]
                    .filter(Boolean)
                    .join(' ')}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={Link ? false : undefined}
                >
                  {activeCollection && <div className={`${baseClass}__link-indicator`} />}
                  <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
                </LinkElement>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
