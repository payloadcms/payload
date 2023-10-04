import { Modal, useModal } from '@faceless-ui/modal'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import type { EntityToGroup, Group } from '../../../utilities/groupNavItems'

import { getTranslation } from '../../../../utilities/getTranslation'
import { EntityType, groupNavItems } from '../../../utilities/groupNavItems'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { Gutter } from '../Gutter'
import Logout from '../Logout'
import NavGroup from './NavGroup'
import './index.scss'

const baseClass = 'main-menu'

export const mainMenuSlug = 'main-menu'

export const MainMenu: React.FC = () => {
  const { permissions, user } = useAuth()
  const { closeModal, modalState } = useModal()

  const { i18n, t } = useTranslation('general')

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks },
    },
    collections,
    globals,
    routes: { admin },
  } = useConfig()

  const [groups, setGroups] = useState<Group[]>([])

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(modalState[mainMenuSlug]?.isOpen)
  }, [modalState])

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
                entity: collection,
                type: EntityType.collection,
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
                entity: global,
                type: EntityType.global,
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
    <Modal
      className={[baseClass, isOpen && `${baseClass}--is-open`].filter(Boolean).join(' ')}
      slug={mainMenuSlug}
    >
      <div className={`${baseClass}__blur-bg`} />
      <nav className={`${baseClass}__content`}>
        <Gutter className={`${baseClass}__content-children`}>
          {Array.isArray(beforeNavLinks) &&
            beforeNavLinks.map((Component, i) => <Component key={i} />)}
          <h4 className={`${baseClass}__link`}>
            <NavLink activeClassName="active" id="nav-dashboard" to={admin}>
              {t('dashboard')}
            </NavLink>
          </h4>
          {groups.map(({ entities, label }, key) => {
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
                    <h4 className={`${baseClass}__link`} key={i}>
                      <NavLink activeClassName="active" id={id} to={href}>
                        {entityLabel}
                      </NavLink>
                    </h4>
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
        </Gutter>
      </nav>
      <button
        aria-label={t('close')}
        className={`${baseClass}__close`}
        id={`close__${mainMenuSlug}`}
        onClick={() => closeModal(mainMenuSlug)}
        type="button"
      />
    </Modal>
  )
}
