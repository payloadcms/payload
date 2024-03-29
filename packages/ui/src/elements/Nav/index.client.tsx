'use client'
import type { VisibleEntities } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import LinkWithDefault from 'next/link.js'
import React from 'react'

import type { EntityToGroup } from '../../utilities/groupNavItems.js'

import { Chevron } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { EntityType, groupNavItems } from '../../utilities/groupNavItems.js'
import { NavGroup } from '../NavGroup/index.js'
import { useNav } from './context.js'

const baseClass = 'nav'

export const DefaultNavClient: React.FC<{
  visibleEntities?: VisibleEntities
}> = ({ visibleEntities }) => {
  const { permissions } = useAuth()

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
        .filter(({ slug }) => visibleEntities?.collections.includes(slug))
        .map((collection) => {
          const entityToGroup: EntityToGroup = {
            type: EntityType.collection,
            entity: collection,
          }

          return entityToGroup
        }),
      ...globals
        .filter(({ slug }) => visibleEntities?.globals.includes(slug))
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
    <div>
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
                  // activeClassName="active"
                  className={`${baseClass}__link`}
                  href={href}
                  id={id}
                  key={i}
                  tabIndex={!navOpen ? -1 : undefined}
                >
                  <span className={`${baseClass}__link-icon`}>
                    <Chevron direction="right" />
                  </span>
                  <span className={`${baseClass}__link-label`}>{entityLabel}</span>
                </LinkElement>
              )
            })}
          </NavGroup>
        )
      })}
    </div>
  )
}
