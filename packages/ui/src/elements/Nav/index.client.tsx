'use client'

import type { NavPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { EntityType, formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import type { groupNavItems } from '../../utilities/groupNavItems.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePathname } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Link } from '../Link/index.js'
import { NavGroup } from '../NavGroup/index.js'

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
                <>
                  {isActive && <div className={`${baseClass}__link-indicator`} />}
                  <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
                </>
              )

              // If the URL matches the link exactly
              if (pathname === href) {
                return (
                  <div className={linkClass} id={id} key={i}>
                    {Label}
                  </div>
                )
              }

              return (
                <Link className={linkClass} href={href} id={id} key={i} prefetch={false}>
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
