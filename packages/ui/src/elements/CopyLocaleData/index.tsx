'use client'

import type { MappedComponent } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
import { Pill } from '../Pill/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'copy-locale-data'

const modalSlug = 'confirm-copy-locale'
export const DefaultComponent: React.FC = () => {
  const {
    config: {
      collections,
      globals,
      localization,
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { code: currentLocale } = useLocale()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { i18n, t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()
  const [visibleDropdown, setVisibleDropdown] = React.useState(false)

  const { toggleModal } = useModal()

  const [copying, setCopying] = React.useState(false)
  const [formattedDestination, setFormattedDestination] = React.useState<null | string>(null)
  const [destinationLocale, setDestinationLocale] = React.useState<null | string>(null)
  const editDepth = useEditDepth()

  const collectionLabel = collections.find((c) => c.slug === collectionSlug)?.labels.singular
  const globalLabel = globals.find((g) => g.slug === globalSlug)?.label

  const copyLocaleData = useCallback(
    async ({ from, to }) => {
      let url
      let redirect
      let method = 'PATCH'

      setCopying(true)

      try {
        if (collectionSlug) {
          url = `${serverURL}${api}/${collectionSlug}/${id}?depth=0&locale=${from}`
          redirect = `${serverURL}/admin/collections/${collectionSlug}/${id}?locale=${to}`
        } else if (globalSlug) {
          url = `${serverURL}${api}/globals/${globalSlug}?depth=0&locale=${from}`
          redirect = `${serverURL}/admin/globals/${globalSlug}?locale=${to}`
          method = 'POST'
        }
        const response = await fetch(url)
        const data = await response.json()
        const action = url.replace(`?locale=${from}`, `?locale=${to}`)

        await submit({
          action,
          method,
          overrides: {
            ...data,
            _status: 'draft',
          },
          skipValidation: true,
        })
        setCopying(false)
        toggleModal(modalSlug)

        if (response.ok) {
          window.open(redirect, '_self')
        }
      } catch (error) {
        toast.error(error.message)
      }
    },
    [collectionSlug, globalSlug, submit, serverURL, api, id, toggleModal],
  )

  if (!localization) {
    return null
  }

  const formattedCurrentLocale = localization?.locales
    .map((locale) => {
      const isMatchingLocale =
        typeof locale === 'string' ? locale === currentLocale : locale.code === currentLocale

      if (isMatchingLocale) {
        return typeof locale.label === 'string' ? locale.label : locale.label?.[i18n?.language]
      }
    })
    .filter(Boolean)

  if (!id && !globalSlug) {
    return null
  }

  return (
    <div className={baseClass}>
      {modified && (
        <button
          aria-label={t('general:unsavedChanges')}
          className={`${baseClass}__overlay`}
          onClick={() => {
            if (modified) {
              toast.info(t('general:unsavedChanges'))
            }
          }}
          type="button"
        />
      )}
      <Popup
        button={
          <Pill
            className={`${baseClass}__pill`}
            icon={
              <ChevronIcon
                className={`${baseClass}__icon`}
                direction={visibleDropdown ? 'up' : 'down'}
              />
            }
            pillStyle="light"
          >
            {t('general:copy')}
          </Pill>
        }
        disabled={modified}
        onToggleOpen={(active) => {
          setVisibleDropdown(active)
        }}
      >
        <PopupList.ButtonGroup>
          {localization.locales.map((locale) => {
            const formattedLabel =
              typeof locale.label === 'string'
                ? locale.label
                : locale.label && locale.label[i18n?.language]

            const isActive =
              typeof locale === 'string' ? locale === currentLocale : locale.code === currentLocale

            if (isActive) {
              return null
            }

            return (
              <PopupList.Button
                key={locale.code}
                onClick={() => {
                  setDestinationLocale(typeof locale === 'string' ? locale : locale.code)
                  setFormattedDestination(formattedLabel)
                  toggleModal(modalSlug)
                }}
              >
                {formattedCurrentLocale} to {formattedLabel}
              </PopupList.Button>
            )
          })}
        </PopupList.ButtonGroup>
      </Popup>
      <Modal
        className={`${baseClass}__modal`}
        slug={modalSlug}
        style={{
          zIndex: drawerZBase + editDepth,
        }}
      >
        <div className={`${baseClass}__wrapper`}>
          <div className={`${baseClass}__content`}>
            <h1>{t('general:confirmCopy')}</h1>
            <p>
              {t('general:copyWarning', {
                from: formattedCurrentLocale,
                label: collectionSlug ? collectionLabel : globalLabel,
                title: collectionSlug ? id : '',
                to: formattedDestination,
              })}
            </p>
          </div>
          <div className={`${baseClass}__controls`}>
            <Button
              buttonStyle="secondary"
              id="confirm-cancel"
              onClick={() => toggleModal(modalSlug)}
              size="large"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button
              id="confirm-copy"
              onClick={async () => {
                if (!copying) {
                  await copyLocaleData({
                    from: currentLocale,
                    to: destinationLocale,
                  })
                }
              }}
              size="large"
            >
              {copying ? `${t('general:copying')}...` : t('general:confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type Props = {
  CustomComponent?: MappedComponent
}

export const CopyLocaleData: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) {
    return <RenderComponent mappedComponent={CustomComponent} />
  }
  return <DefaultComponent />
}
