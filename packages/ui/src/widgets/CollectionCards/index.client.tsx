'use client'
import type { ClientUser } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { CollectionCardsData } from './getCollectionCardsData.js'

import './index.css'
import { Button } from '../../elements/Button/index.js'
import { Card } from '../../elements/Card/index.js'
import { Locked } from '../../elements/Locked/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { EntityType } from '../../utilities/groupNavItems.js'

const baseClass = 'collections'

export const CollectionCardsClient: React.FC<CollectionCardsData> = ({
  adminRoute,
  globalData,
  navGroups,
  permissions,
  userId,
}) => {
  const { i18n, t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
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
                    let userEditing: ClientUser | null = null

                    if (type === EntityType.collection) {
                      title = getTranslation(label, i18n)

                      buttonAriaLabel = t('general:showAllLabel', { label: title })

                      href = formatAdminURL({
                        adminRoute,
                        path: `/collections/${slug}`,
                      })

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

                      const globalLockData = globalData.find((global) => global.slug === slug)

                      if (globalLockData) {
                        isLocked = globalLockData.data._isLocked
                        userEditing = globalLockData.data._userEditing as ClientUser | null

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
                            isLocked && userId !== userEditing?.id ? (
                              <Locked className={`${baseClass}__locked`} user={userEditing} />
                            ) : hasCreatePermission && type === EntityType.collection ? (
                              <Button
                                aria-label={t('general:createNewLabel', {
                                  label,
                                })}
                                buttonStyle="ghost"
                                el="link"
                                icon="plus"
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
      </div>
    </div>
  )
}
