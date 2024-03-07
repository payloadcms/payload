'use client'
import type { EntityToGroup, Group } from '@payloadcms/ui'
import type { Permissions } from 'payload/auth'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Card,
  EntityType,
  SetViewActions,
  groupNavItems,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import React, { Fragment, useEffect, useState } from 'react'

import './index.scss'

const baseClass = 'dashboard'

export const DefaultDashboardClient: React.FC<{
  Link: React.ComponentType
  permissions: Permissions
  visibleCollections: string[]
  visibleGlobals: string[]
}> = ({ Link, permissions, visibleCollections, visibleGlobals }) => {
  const config = useConfig()

  const {
    collections: collectionsConfig,
    globals: globalsConfig,
    routes: { admin },
  } = config

  const { user } = useAuth()

  const { i18n, t } = useTranslation()

  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    const collections = collectionsConfig.filter(
      (collection) =>
        permissions?.collections?.[collection.slug]?.read?.permission &&
        visibleCollections.includes(collection.slug),
    )

    const globals = globalsConfig.filter(
      (global) =>
        permissions?.globals?.[global.slug]?.read?.permission &&
        visibleGlobals.includes(global.slug),
    )

    setGroups(
      groupNavItems(
        [
          ...(collections.map((collection) => {
            const entityToGroup: EntityToGroup = {
              type: EntityType.collection,
              entity: collection,
            }

            return entityToGroup
          }) ?? []),
          ...(globals.map((global) => {
            const entityToGroup: EntityToGroup = {
              type: EntityType.global,
              entity: global,
            }

            return entityToGroup
          }) ?? []),
        ],
        permissions,
        i18n,
      ),
    )
  }, [
    permissions,
    user,
    i18n,
    visibleCollections,
    visibleGlobals,
    collectionsConfig,
    globalsConfig,
  ])

  return (
    <Fragment>
      <SetViewActions actions={[]} />
      {groups.map(({ entities, label }, groupIndex) => {
        return (
          <div className={`${baseClass}__group`} key={groupIndex}>
            <h2 className={`${baseClass}__label`}>{label}</h2>
            <ul className={`${baseClass}__card-list`}>
              {entities.map(({ type, entity }, entityIndex) => {
                let title: string
                let buttonAriaLabel: string
                let createHREF: string
                let href: string
                let hasCreatePermission: boolean

                if (type === EntityType.collection) {
                  title = getTranslation(entity.labels.plural, i18n)
                  buttonAriaLabel = t('general:showAllLabel', { label: title })
                  href = `${admin}/collections/${entity.slug}`
                  createHREF = `${admin}/collections/${entity.slug}/create`
                  hasCreatePermission = permissions?.collections?.[entity.slug]?.create?.permission
                }

                if (type === EntityType.global) {
                  title = getTranslation(entity.label, i18n)
                  buttonAriaLabel = t('general:editLabel', {
                    label: getTranslation(entity.label, i18n),
                  })
                  href = `${admin}/globals/${entity.slug}`
                }

                return (
                  <li key={entityIndex}>
                    <Card
                      Link={Link}
                      actions={
                        hasCreatePermission && type === EntityType.collection ? (
                          <Button
                            Link={Link}
                            aria-label={t('general:createNewLabel', {
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
                      href={href}
                      id={`card-${entity.slug}`}
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
    </Fragment>
  )
}
