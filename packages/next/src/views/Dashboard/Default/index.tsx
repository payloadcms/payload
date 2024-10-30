import type { groupNavItems } from '@payloadcms/ui/shared'
import type { ClientUser, Permissions, ServerProps, VisibleEntities } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Button, Card, Gutter, Locked, SetStepNav, SetViewActions } from '@payloadcms/ui'
import {
  EntityType,
  formatAdminURL,
  getCreateMappedComponent,
  RenderComponent,
} from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  Link: React.ComponentType<any>
  navGroups?: ReturnType<typeof groupNavItems>
  permissions: Permissions
  visibleEntities: VisibleEntities
} & ServerProps

export const DefaultDashboard: React.FC<DashboardProps> = (props) => {
  const {
    globalData,
    i18n,
    i18n: { t },
    Link,
    locale,
    navGroups,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
        routes: { admin: adminRoute },
      },
    },
    payload,
    permissions,
    searchParams,
    user,
  } = props

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const mappedBeforeDashboards = createMappedComponent(
    beforeDashboard,
    undefined,
    undefined,
    'beforeDashboard',
  )

  const mappedAfterDashboards = createMappedComponent(
    afterDashboard,
    undefined,
    undefined,
    'afterDashboard',
  )

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <SetViewActions actions={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        <RenderComponent mappedComponent={mappedBeforeDashboards} />
        <Fragment>
          <SetViewActions actions={[]} />
          {!navGroups || navGroups?.length === 0 ? (
            <p>no nav groups....</p>
          ) : (
            navGroups.map(({ entities, label }, groupIndex) => {
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
                      let isLocked = null
                      let userEditing = null

                      if (type === EntityType.collection) {
                        title = getTranslation(entity.labels.plural, i18n)

                        buttonAriaLabel = t('general:showAllLabel', { label: title })

                        href = formatAdminURL({ adminRoute, path: `/collections/${entity.slug}` })

                        createHREF = formatAdminURL({
                          adminRoute,
                          path: `/collections/${entity.slug}/create`,
                        })

                        hasCreatePermission =
                          permissions?.collections?.[entity.slug]?.create?.permission
                      }

                      if (type === EntityType.global) {
                        title = getTranslation(entity.label, i18n)

                        buttonAriaLabel = t('general:editLabel', {
                          label: getTranslation(entity.label, i18n),
                        })

                        href = formatAdminURL({
                          adminRoute,
                          path: `/globals/${entity.slug}`,
                        })

                        // Find the lock status for the global
                        const globalLockData = globalData.find(
                          (global) => global.slug === entity.slug,
                        )

                        if (globalLockData) {
                          isLocked = globalLockData.data._isLocked
                          userEditing = globalLockData.data._userEditing

                          // Check if the lock is expired
                          const lockDuration = globalLockData?.lockDuration
                          const lastEditedAt = new Date(
                            globalLockData.data?._lastEditedAt,
                          ).getTime()

                          const lockDurationInMilliseconds = lockDuration * 1000
                          const lockExpirationTime = lastEditedAt + lockDurationInMilliseconds

                          if (new Date().getTime() > lockExpirationTime) {
                            isLocked = false
                            userEditing = null
                          }
                        }
                      }

                      return (
                        <li key={entityIndex}>
                          <Card
                            actions={
                              isLocked && user?.id !== userEditing?.id ? (
                                <Locked className={`${baseClass}__locked`} user={userEditing} />
                              ) : hasCreatePermission && type === EntityType.collection ? (
                                <Button
                                  aria-label={t('general:createNewLabel', {
                                    label: getTranslation(entity.labels.singular, i18n),
                                  })}
                                  buttonStyle="icon-label"
                                  el="link"
                                  icon="plus"
                                  iconStyle="with-border"
                                  Link={Link}
                                  round
                                  to={createHREF}
                                />
                              ) : undefined
                            }
                            buttonAriaLabel={buttonAriaLabel}
                            href={href}
                            id={`card-${entity.slug}`}
                            Link={Link}
                            title={title}
                            titleAs="h3"
                          />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </Fragment>
        <RenderComponent mappedComponent={mappedAfterDashboards} />
      </Gutter>
    </div>
  )
}
