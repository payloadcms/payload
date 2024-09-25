import type { groupNavItems } from '@payloadcms/ui/shared'
import type { ClientUser, Permissions, ServerProps, VisibleEntities } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Button, Card, Gutter, Locked, SetStepNav, SetViewActions } from '@payloadcms/ui'
import { EntityType, formatAdminURL } from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../../elements/RenderServerComponent/index.js'
import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = {
  globalData: Array<{ data: { _isLocked: boolean; _userEditing: ClientUser | null }; slug: string }>
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

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <SetViewActions actions={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        {beforeDashboard && (
          <RenderServerComponent
            Component={beforeDashboard}
            importMap={payload.importMap}
            serverProps={{
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            }}
          />
        )}
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
                      let buttonAriaLabel: string
                      let createHREF: string
                      let href: string
                      let hasCreatePermission: boolean
                      let lockStatus = null
                      let userEditing = null

                      if (type === EntityType.collection) {
                        buttonAriaLabel = t('general:showAllLabel', { label })

                        href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })

                        createHREF = formatAdminURL({
                          adminRoute,
                          path: `/collections/${slug}/create`,
                        })

                        hasCreatePermission = permissions?.collections?.[slug]?.create?.permission
                      }

                      if (type === EntityType.global) {
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
                          lockStatus = globalLockData.data._isLocked
                          userEditing = globalLockData.data._userEditing
                        }
                      }

                      return (
                        <li key={entityIndex}>
                          <Card
                            actions={
                              lockStatus && user?.id !== userEditing?.id ? (
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
                                  Link={Link}
                                  round
                                  to={createHREF}
                                />
                              ) : undefined
                            }
                            buttonAriaLabel={buttonAriaLabel}
                            href={href}
                            id={`card-${slug}`}
                            Link={Link}
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
        {afterDashboard && (
          <RenderServerComponent
            Component={afterDashboard}
            importMap={payload.importMap}
            serverProps={{
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            }}
          />
        )}
      </Gutter>
    </div>
  )
}
