'use client'

import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL, hasDraftsEnabled } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'
import { SelectLocalesDrawer } from './SelectLocalesDrawer/index.js'

export type Props = {
  readonly id: number | string
  readonly onDuplicate?: DocumentDrawerContextType['onDuplicate']
  readonly redirectAfterDuplicate?: boolean
  readonly selectLocales?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly slug: string
}

export const DuplicateDocument: React.FC<Props> = ({
  id,
  slug,
  onDuplicate,
  redirectAfterDuplicate = true,
  selectLocales,
  singularLabel,
}) => {
  const router = useRouter()
  const modified = useFormModified()
  const { openModal } = useModal()
  const { code: localeCode } = useLocale()
  const { setModified } = useForm()
  const { startRouteTransition } = useRouteTransition()

  const {
    config: {
      localization,
      routes: { admin: adminRoute, api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`
  const drawerSlug = `duplicate-locales-${id}`

  const isDuplicateByLocaleEnabled = useMemo(() => {
    if (selectLocales && collectionConfig) {
      return traverseForLocalizedFields(collectionConfig.fields)
    }
    return false
  }, [collectionConfig, selectLocales])

  const handleDuplicate = useCallback(
    async (args?: { selectedLocales?: string[] }) => {
      const { selectedLocales } = args || {}
      const hasSelectedLocales = selectedLocales && selectedLocales.length > 0

      const queryParams: Record<string, string | string[]> = {}
      if (localeCode) {
        queryParams.locale = localeCode
      }
      if (hasSelectedLocales) {
        queryParams.selectedLocales = selectedLocales
      }

      const headers = {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
        credentials: 'include',
      }

      try {
        const res = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/${slug}/${id}/duplicate${qs.stringify(queryParams, {
              addQueryPrefix: true,
            })}`,
          }),
          {
            body: JSON.stringify(hasDraftsEnabled(collectionConfig) ? { _status: 'draft' } : {}),
            headers,
          },
        )

        const { doc, errors, message } = await res.json()

        if (res.status < 400) {
          toast.success(
            message ||
              t('general:successfullyDuplicated', { label: getTranslation(singularLabel, i18n) }),
          )

          setModified(false)

          if (redirectAfterDuplicate) {
            return startRouteTransition(() =>
              router.push(
                formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}/${doc.id}${localeCode ? `?locale=${localeCode}` : ''}`,
                }),
              ),
            )
          }

          if (typeof onDuplicate === 'function') {
            void onDuplicate({ collectionConfig, doc })
          }
        } else {
          toast.error(
            errors?.[0].message ||
              message ||
              t('error:unspecific', { label: getTranslation(singularLabel, i18n) }),
          )
        }
      } catch (_error) {
        toast.error(t('error:unspecific', { label: getTranslation(singularLabel, i18n) }))
      }
    },
    [
      adminRoute,
      apiRoute,
      collectionConfig,
      i18n,
      id,
      localeCode,
      onDuplicate,
      redirectAfterDuplicate,
      router,
      setModified,
      singularLabel,
      slug,
      startRouteTransition,
      t,
    ],
  )

  const handleConfirmWithoutSaving = useCallback(async () => {
    if (selectLocales) {
      openModal(drawerSlug)
    } else {
      await handleDuplicate()
    }
  }, [handleDuplicate, drawerSlug, selectLocales, openModal])

  const buttonLabel = selectLocales
    ? `${t('general:duplicate')} ${t('localization:selectedLocales')}`
    : t('general:duplicate')

  if (!selectLocales || isDuplicateByLocaleEnabled) {
    return (
      <React.Fragment>
        <PopupList.Button
          id={`action-duplicate${isDuplicateByLocaleEnabled ? `-locales` : ''}`}
          onClick={() => {
            if (modified) {
              openModal(modalSlug)
            } else if (selectLocales) {
              openModal(drawerSlug)
            } else {
              void handleDuplicate()
            }
          }}
        >
          {buttonLabel}
        </PopupList.Button>
        <ConfirmationModal
          body={t('general:unsavedChangesDuplicate')}
          confirmLabel={t('general:duplicateWithoutSaving')}
          heading={t('general:unsavedChanges')}
          modalSlug={modalSlug}
          onConfirm={handleConfirmWithoutSaving}
        />
        {selectLocales && localization && (
          <SelectLocalesDrawer
            localization={localization}
            onConfirm={handleDuplicate}
            slug={drawerSlug}
          />
        )}
      </React.Fragment>
    )
  }

  return null
}
