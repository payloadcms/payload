'use client'

import type { EntityToGroup } from '@payloadcms/ui/utilities/groupNavItems'

import { getTranslation } from '@payloadcms/translations'
import {
  ChevronIcon,
  NavGroup,
  useAuth,
  useConfig,
  useEntityVisibility,
  useNav,
  useTranslation,
} from '@payloadcms/ui/client'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import LinkWithDefault from 'next/link.js'
import React, { Fragment } from 'react'

const baseClass = 'nav'

export const DefaultNavClient: React.FC = () => {
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()

  const {
    collections,
    globals,
    routes: { admin },
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
                href = `${admin}/collections/${entity.slug}`
                entityLabel = getTranslation(entity.labels.plural, i18n)
                id = `nav-${entity.slug}`
              }

              if (type === EntityType.global) {
                href = `${admin}/globals/${entity.slug}`
                entityLabel = getTranslation(entity.label, i18n)
                id = `nav-global-${entity.slug}`
              }

              const Link = (LinkWithDefault.default ||
                LinkWithDefault) as typeof LinkWithDefault.default

              const LinkElement = Link || 'a'

              return (
                <LinkElement
                  className={`${baseClass}__link`}
                  href={href}
                  id={id}
                  key={i}
                  tabIndex={!navOpen ? -1 : undefined}
                >
                  <span className={`${baseClass}__link-icon`}>
                    <ChevronIcon direction="right" />
                  </span>
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
