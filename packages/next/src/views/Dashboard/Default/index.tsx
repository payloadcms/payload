import type { groupNavItems } from '@payloadcms/ui/shared'
import type { ClientUser, Locale, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Button, Card, Gutter, Locked } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import './index.scss'

const baseClass = 'dashboard'

export type DashboardViewClientProps = {
  locale: Locale
}

export type DashboardViewServerPropsOnly = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: React.ComponentType
  navGroups?: ReturnType<typeof groupNavItems>
} & ServerProps

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export function DefaultDashboard(props: DashboardViewServerProps) {
  const {
    globalData,
    i18n,
    i18n: { t },
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

  return (
    <div className={baseClass}>
      <Gutter className={`${baseClass}__wrap`}>
        {beforeDashboard &&
          RenderServerComponent({
            Component: beforeDashboard,
            importMap: payload.importMap,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            } satisfies ServerProps,
          })}

        <Fragment>
          {!navGroups || navGroups?.length === 0 ? (
            <p>no nav groups....</p>
          ) : (
            navGroups.map(({ entities, label }, groupIndex) => {
              return (
                <div className={`${baseClass}__group`} key={groupIndex}>
                  <h2 className={`${baseClass}__label`}>{label}</h2>
                  <ul className={`${baseClass}__card-list`}>
                    {entities.map(({ slug, type, label }, entityIndex) => {
                      let title: string
                      let buttonAriaLabel: string
                      let createHREF: string
                      let href: string
                      let hasCreatePermission: boolean
                      let isLocked = null
                      let userEditing = null

                      if (type === EntityType.collection) {
                        title = getTranslation(label, i18n)

                        buttonAriaLabel = t('general:showAllLabel', { label: title })

                        href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })

                        createHREF = formatAdminURL({
                          adminRoute,
                          path: `/collections/${slug}/create`,
                        })

                        hasCreatePermission = permissions?.collections?.[slug]?.create
                      }

                      if (type === EntityType.global) {
                        title = getTranslation(label, i18n)

                        buttonAriaLabel = t('general:editLabel', {
                          label: getTranslation(label, i18n),
                        })

                        href = formatAdminURL({
                          adminRoute,
                          path: `/globals/${slug}`,
                        })

                        // Find the lock status for the global
                        const globalLockData = globalData.find((global) => global.slug === slug)
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
                                    label,
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
                            id={`card-${slug}`}
                            title={getTranslation(label, i18n)}
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
        {afterDashboard &&
          RenderServerComponent({
            Component: afterDashboard,
            importMap: payload.importMap,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            } satisfies ServerProps,
          })}
      </Gutter>
    </div>
  )
}
