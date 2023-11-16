'use client'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { EntityToGroup, Group } from '../../utilities/groupNavItems'
import type { Props } from './types'

import { getTranslation } from 'payload/utilities'
import { EntityType, groupNavItems } from '../../utilities/groupNavItems'
import { Button } from '../../elements/Button'
import { Card } from '../../elements/Card'
import { Gutter } from '../../elements/Gutter'
import './index.scss'
import { ClientConfig } from 'payload/config'
import { useAuth } from '../../providers/Auth'

const baseClass = 'dashboard'

export const DefaultDashboardClient: React.FC<
  Omit<Props, 'config'> & {
    config: ClientConfig
  }
> = (props) => {
  const {
    config,
    config: {
      routes: { admin },
    },
  } = props

  const { permissions, user } = useAuth()

  const collections = config.collections.filter(
    (collection) => permissions?.collections?.[collection.slug]?.read?.permission,
  )

  const globals = config.globals.filter(
    (global) => permissions?.globals?.[global.slug]?.read?.permission,
  )

  const { i18n, t } = useTranslation('general')

  const [groups, setGroups] = useState<Group[]>([])

  // useEffect(() => {
  //   setGroups(
  //     groupNavItems(
  //       [
  //         ...(collections
  //           ?.filter(
  //             ({ admin: { hidden } }) =>
  //               !(typeof hidden === 'function' ? hidden({ user }) : hidden),
  //           )
  //           .map((collection) => {
  //             const entityToGroup: EntityToGroup = {
  //               entity: collection,
  //               type: EntityType.collection,
  //             }

  //             return entityToGroup
  //           }) ?? []),
  //         ...(globals
  //           ?.filter(
  //             ({ admin: { hidden } }) =>
  //               !(typeof hidden === 'function' ? hidden({ user }) : hidden),
  //           )
  //           .map((global) => {
  //             const entityToGroup: EntityToGroup = {
  //               entity: global,
  //               type: EntityType.global,
  //             }

  //             return entityToGroup
  //           }) ?? []),
  //       ],
  //       permissions,
  //       i18n,
  //     ),
  //   )
  // }, [collections, globals, i18n, permissions, user])

  return (
    <div className={baseClass}>
      <Gutter className={`${baseClass}__wrap`}>
        {groups.map(({ entities, label }, groupIndex) => {
          return (
            <div className={`${baseClass}__group`} key={groupIndex}>
              <h2 className={`${baseClass}__label`}>{label}</h2>
              <ul className={`${baseClass}__card-list`}>
                {entities.map(({ entity, type }, entityIndex) => {
                  let title: string
                  let buttonAriaLabel: string
                  let createHREF: string
                  let onClick: () => void
                  let hasCreatePermission: boolean

                  if (type === EntityType.collection) {
                    title = getTranslation(entity.labels.plural, i18n)
                    buttonAriaLabel = t('showAllLabel', { label: title })
                    // onClick = () => push({ pathname: `${admin}/collections/${entity.slug}` })
                    createHREF = `${admin}/collections/${entity.slug}/create`
                    hasCreatePermission =
                      permissions?.collections?.[entity.slug]?.create?.permission
                  }

                  if (type === EntityType.global) {
                    title = getTranslation(entity.label, i18n)
                    buttonAriaLabel = t('editLabel', { label: getTranslation(entity.label, i18n) })
                    // onClick = () => push({ pathname: `${admin}/globals/${entity.slug}` })
                  }

                  return (
                    <li key={entityIndex}>
                      <Card
                        actions={
                          hasCreatePermission && type === EntityType.collection ? (
                            <Button
                              aria-label={t('createNewLabel', {
                                label: getTranslation(entity.labels.singular, i18n),
                              })}
                              buttonStyle="icon-label"
                              el="link"
                              icon="plus"
                              iconStyle="with-border"
                              round
                              to={createHREF}
                            />
                          ) : undefined
                        }
                        buttonAriaLabel={buttonAriaLabel}
                        id={`card-${entity.slug}`}
                        onClick={onClick}
                        title={title}
                        titleAs="h3"
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </Gutter>
    </div>
  )
}
