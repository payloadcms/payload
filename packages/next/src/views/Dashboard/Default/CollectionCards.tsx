import { getTranslation } from '@payloadcms/translations'
import { Button, Card, Locked } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import { baseClass, type DashboardViewServerPropsOnly } from './index.js'

export function CollectionCards(props: DashboardViewServerPropsOnly) {
  const { globalData, i18n, navGroups, payload, permissions, user } = props
  const { admin: adminRoute } = payload.config.routes
  const { t } = i18n

  return (
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
                      const lastEditedAt = new Date(globalLockData.data?._lastEditedAt).getTime()

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
  )
}
