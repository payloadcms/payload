'use client'

import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { CheckboxInput } from '../../fields/Checkbox/index.js'
import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { DrawerHeader } from '../BulkUpload/Header/index.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Drawer } from '../Drawer/index.js'
import { PopupList } from '../Popup/index.js'
import './index.scss'

export type Props = {
  readonly id: string
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
  const { openModal, toggleModal } = useModal()
  const { code: localeCode } = useLocale()
  const { setModified } = useForm()
  const { startRouteTransition } = useRouteTransition()

  const {
    config: {
      localization,
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const [renderModal, setRenderModal] = React.useState(false)
  const [selectedLocales, setSelectedLocales] = React.useState<string[]>([])
  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`
  const drawerSlug = `duplicate-locales-${id}`
  const popupID = `action-duplicate${selectLocales ? `-locales` : ''}`
  const baseClass = 'duplicate-selected-locales'

  const [hasLocalizedFields, setHasLocalizedFields] = React.useState(false)

  React.useEffect(() => {
    const hasLocalizedField = traverseForLocalizedFields(collectionConfig?.fields)
    setHasLocalizedFields(hasLocalizedField)
  }, [collectionConfig?.fields])

  const localeOptions =
    (localization &&
      localization.locales.map((locale) => (typeof locale === 'string' ? { label: locale, value: locale } : { label: locale.label, value: locale.code }))) ||
    []

  const allLocales = localeOptions.map((locale) => locale.value)

  const arraysEqual = (a = [], b = []) => {
    if (a.length !== b.length) {
      return false
    }
    const sa = [...a].slice().sort()
    const sb = [...b].slice().sort()
    return sa.every((v, i) => v === sb[i])
  }

  const allLocalesSelected = arraysEqual(selectedLocales, allLocales)

  const duplicate = useCallback(async (selectLocales: boolean = false) => {
    setRenderModal(true)

    const url = `${serverURL}${apiRoute}/${slug}/${id}/duplicate${localeCode ? `?locale=${localeCode}` : ''}${(selectLocales && !allLocalesSelected) ? `&selectedLocales=[${selectedLocales.join(',')}]` : ''}`
    const headers = {
      'Accept-Language': i18n.language,
      'Content-Type': 'application/json',
      credentials: 'include',
    }

    await requests
      .post(
        url,
        {
          body: JSON.stringify({}),
          headers,
        },
      )
      .then(async (res) => {
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
      })
  }, [
    localeCode,
    serverURL,
    apiRoute,
    slug,
    id,
    i18n,
    t,
    singularLabel,
    onDuplicate,
    redirectAfterDuplicate,
    setModified,
    router,
    adminRoute,
    collectionConfig,
    startRouteTransition,
    selectedLocales,
    allLocalesSelected,
  ])

  const onConfirm = useCallback(async () => {
    setRenderModal(false)

    if (selectLocales) {
      openModal(drawerSlug)
      return
    } else {
      await duplicate()
    }
  }, [duplicate, drawerSlug, selectLocales, openModal])

  if (
    !selectLocales || selectLocales && hasLocalizedFields
  ) {
    return (
      <React.Fragment>
        <PopupList.Button
          id={popupID}
          onClick={() => {
            if (modified) {
              setRenderModal(true)
              return openModal(modalSlug)
            } else if (selectLocales && !modified) {
              return openModal(drawerSlug)
            }

            return duplicate()
          }}
        >
          {t('general:duplicate')} {selectLocales && ' ' + t('localization:selectedLocales')}
        </PopupList.Button>
        {renderModal && (
          <ConfirmationModal
            body={t('general:unsavedChangesDuplicate')}
            confirmLabel={t('general:duplicateWithoutSaving')}
            heading={t('general:unsavedChanges')}
            modalSlug={modalSlug}
            onConfirm={onConfirm}
          />
        )}
        {/* Select locales to duplicate drawer */}
        {
          selectLocales &&
          <Drawer
            className={baseClass}
            gutter={false}
            Header={
              <DrawerHeader
                onClose={() => {
                  toggleModal(drawerSlug)
                }}
                title={t('general:duplicate') + ' ' + t('localization:selectedLocales')}
              />
            }
            slug={drawerSlug}
          >
            <div className={`${baseClass}__sub-header`}>
              <span>
                {t('localization:selectLocaleToDuplicate')}
              </span>
              <Button
                buttonStyle="primary"
                disabled={selectedLocales?.length === 0}
                iconPosition="left"
                id="#action-duplicate-confirm"
                onClick={async () => {
                  await duplicate(true)
                  toggleModal(drawerSlug)
                }}
                size="medium"
              >
                {t('general:duplicate')}
              </Button>
            </div>
            <div className={`${baseClass}__content`}>
              <div className={`${baseClass}__item`}>
                <CheckboxInput
                  checked={allLocalesSelected}
                  id="duplicate-locale-select-all"
                  onToggle={() => {
                    setSelectedLocales(allLocalesSelected ? [] : [...allLocales])
                  }}

                />
                <span>{t('general:selectAll', { count: allLocales.length, label: t('general:locales') })}</span>
              </div>
              {localeOptions.map((locale) => (
                <div
                  className={`${baseClass}__item`} key={`${locale.value}`}>
                  <CheckboxInput
                    checked={selectedLocales.includes(locale.value)}
                    id={`duplicate-locale-${locale.value}`}
                    onToggle={() => {
                      setSelectedLocales(prev =>
                        !selectedLocales.includes(locale.value)
                          ? [...prev, locale.value]
                          : prev.filter(l => l !== locale.value)
                      )
                    }}
                  />
                  <span>{typeof locale.label === 'string' ? locale.label : JSON.stringify(locale.label)}</span>
                </div>
              ))}
            </div>

          </Drawer>
        }
      </React.Fragment>
    )
  }
}
