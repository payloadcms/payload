import type { Permissions } from 'payload/auth'
import type { ServerProps } from 'payload/config'
import type { VisibleEntities } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { Button } from '@payloadcms/ui/elements/Button'
import { Card } from '@payloadcms/ui/elements/Card'
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { EntityType, type groupNavItems } from '@payloadcms/ui/utilities/groupNavItems'
import React, { Fragment } from 'react'

import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = ServerProps & {
  Link: React.ComponentType<any>
  navGroups?: ReturnType<typeof groupNavItems>
  permissions: Permissions
  visibleEntities: VisibleEntities
}

export const DefaultDashboard: React.FC<DashboardProps> = (props) => {
  const {
    Link,
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

  const BeforeDashboards = Array.isArray(beforeDashboard)
    ? beforeDashboard.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  const AfterDashboards = Array.isArray(afterDashboard)
    ? afterDashboard.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <SetViewActions actions={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        {Array.isArray(BeforeDashboards) && BeforeDashboards.map((Component) => Component)}
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

                      if (type === EntityType.collection) {
                        title = getTranslation(entity.labels.plural, i18n)
                        buttonAriaLabel = t('general:showAllLabel', { label: title })
                        href = `${adminRoute}/collections/${entity.slug}`
                        createHREF = `${adminRoute}/collections/${entity.slug}/create`
                        hasCreatePermission =
                          permissions?.collections?.[entity.slug]?.create?.permission
                      }

                      if (type === EntityType.global) {
                        title = getTranslation(entity.label, i18n)
                        buttonAriaLabel = t('general:editLabel', {
                          label: getTranslation(entity.label, i18n),
                        })
                        href = `${adminRoute}/globals/${entity.slug}`
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
            })
          )}
        </Fragment>
        {Array.isArray(AfterDashboards) && AfterDashboards.map((Component) => Component)}
      </Gutter>
    </div>
  )
}
