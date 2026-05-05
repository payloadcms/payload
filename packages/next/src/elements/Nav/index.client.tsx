'use client'

import type { groupNavItems } from '@payloadcms/ui/shared'
import type { NavPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Link, NavGroup, useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

const baseClass = 'nav'

/**
 * @internal
 */
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

              const isActive =
                pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

              const linkClass = `${baseClass}__link${isActive ? ` ${baseClass}__link--selected` : ''}`

              const Label = (
                <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
              )

              // If the URL matches the link exactly
              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link-wrapper`} key={i}>
                    <div className={linkClass} id={id}>
                      {Label}
                    </div>
                  </div>
                )
              }

              return (
                <div className={`${baseClass}__link-wrapper`} key={i}>
                  <Link className={linkClass} href={href} id={id} prefetch={false}>
                    {Label}
                  </Link>
                </div>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
