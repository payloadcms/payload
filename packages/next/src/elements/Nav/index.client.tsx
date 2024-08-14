'use client'

import type { EntityToGroup } from '@payloadcms/ui/shared'

import { getTranslation } from '@payloadcms/translations'
import {
  ChevronIcon,
  NavGroup,
  useAuth,
  useConfig,
  useEntityVisibility,
  useNav,
  useTranslation,
} from '@payloadcms/ui'
import { EntityType, formatAdminURL, groupNavItems } from '@payloadcms/ui/shared'
import LinkWithDefault from 'next/link.js'
import { usePathname } from 'next/navigation.js'
import React, { Fragment } from 'react'

const baseClass = 'nav'

export const DefaultNavClient: React.FC = () => {
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const pathname = usePathname()

  const {
    config: {
      collections,
      globals,
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()
  const { navOpen } = useNav()

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => isEntityVisible({ collectionSlug: slug }))
        .map((collection) => {
          const entityToGroup: EntityToGroup = {
            type: EntityType.collection,
            entity: collection,
          }

          return entityToGroup
        }),
      ...globals
        .filter(({ slug }) => isEntityVisible({ globalSlug: slug }))
        .map((global) => {
          const entityToGroup: EntityToGroup = {
            type: EntityType.global,
            entity: global,
          }

          return entityToGroup
        }),
    ],
    permissions,
    i18n,
  )

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup key={key} label={label}>
            {entities.map(({ type, entity }, i) => {
              let entityLabel: string
              let href: string
              let id: string

              if (type === EntityType.collection) {
                href = formatAdminURL({ adminRoute, path: `/collections/${entity.slug}` })
                entityLabel = getTranslation(entity.labels.plural, i18n)
                id = `nav-${entity.slug}`
              }

              if (type === EntityType.global) {
                href = formatAdminURL({ adminRoute, path: `/globals/${entity.slug}` })
                entityLabel = getTranslation(entity.label, i18n)
                id = `nav-global-${entity.slug}`
              }

              const Link = (LinkWithDefault.default ||
                LinkWithDefault) as typeof LinkWithDefault.default

              const LinkElement = Link || 'a'
              const activeCollection = pathname.endsWith(href)

              return (
                <LinkElement
                  className={[`${baseClass}__link`, activeCollection && `active`]
                    .filter(Boolean)
                    .join(' ')}
                  href={href}
                  id={id}
                  key={i}
                  tabIndex={!navOpen ? -1 : undefined}
                >
                  {activeCollection && <div className={`${baseClass}__link-indicator`} />}
                  <span className={`${baseClass}__link-label`}>{entityLabel}</span>
                </LinkElement>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
