import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../utilities/Config'
import { useAuth } from '../../utilities/Auth'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import Chevron from '../../icons/Chevron'
import Logout from '../Logout'
import { EntityToGroup, EntityType, Group, groupNavItems } from '../../../utilities/groupNavItems'
import { getTranslation } from '../../../../utilities/getTranslation'
import NavGroup from '../NavGroup'
import { useNav } from './context'

import './index.scss'
import { X } from '../..'
import { NavIcon } from './NavIcon'

const baseClass = 'nav'

const DefaultNav: React.FC = () => {
  const { navOpen, setNavOpen } = useNav()
  const { permissions, user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const { t, i18n } = useTranslation('general')

  const {
    collections,
    globals,
    routes: { admin },
    admin: {
      components: { beforeNavLinks, afterNavLinks },
    },
  } = useConfig()

  useEffect(() => {
    setGroups(
      groupNavItems(
        [
          ...collections
            .filter(
              ({ admin: { hidden } }) =>
                !(typeof hidden === 'function' ? hidden({ user }) : hidden),
            )
            .map((collection) => {
              const entityToGroup: EntityToGroup = {
                type: EntityType.collection,
                entity: collection,
              }

              return entityToGroup
            }),
          ...globals
            .filter(
              ({ admin: { hidden } }) =>
                !(typeof hidden === 'function' ? hidden({ user }) : hidden),
            )
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
      ),
    )
  }, [collections, globals, permissions, i18n, i18n.language, user])

  return (
    <aside className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__scroll`}>
        <nav className={`${baseClass}__wrap`}>
          {Array.isArray(beforeNavLinks) &&
            beforeNavLinks.map((Component, i) => <Component key={i} />)}
          {groups.map(({ label, entities }, key) => {
            return (
              <NavGroup {...{ key, label }}>
                {entities.map(({ entity, type }, i) => {
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

                  return (
                    <NavLink
                      id={id}
                      className={`${baseClass}__link`}
                      activeClassName="active"
                      key={i}
                      to={href}
                    >
                      <span className={`${baseClass}__link-icon`}>&mdash;&nbsp;</span>
                      <span className={`${baseClass}__link-label`}>{entityLabel}</span>
                    </NavLink>
                  )
                })}
              </NavGroup>
            )
          })}
          {Array.isArray(afterNavLinks) &&
            afterNavLinks.map((Component, i) => <Component key={i} />)}
          <div className={`${baseClass}__controls`}>
            <Logout />
          </div>
        </nav>
      </div>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <button
            className={`${baseClass}__mobile-close`}
            onClick={() => {
              setNavOpen(false)
            }}
          >
            <NavIcon isActive />
          </button>
        </div>
      </div>
    </aside>
  )
}

export const Nav: React.FC = () => {
  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig()

  return <RenderCustomComponent CustomComponent={CustomNav} DefaultComponent={DefaultNav} />
}
