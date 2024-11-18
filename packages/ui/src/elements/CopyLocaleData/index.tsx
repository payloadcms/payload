'use client'

import { useModal } from '@faceless-ui/modal'
import { useRouter } from 'next/navigation.js'
import { deepMergeWithCombinedArrays } from 'payload/shared'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { CheckboxField } from '../../fields/Checkbox/index.js'
import { SelectField } from '../../fields/Select/index.js'
import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { DrawerHeader } from '../BulkUpload/Header/index.js'
import { Button } from '../Button/index.js'
import { Drawer } from '../Drawer/index.js'
import { PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'copy-locale-data'

const drawerSlug = 'copy-locale'
export const CopyLocaleData: React.FC = () => {
  const {
    config: {
      localization,
      routes: { admin, api },
      serverURL,
    },
  } = useConfig()
  const { code: currentLocale } = useLocale()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()
  const { toggleModal } = useModal()
  const router = useRouter()

  const localeOptions =
    (localization &&
      localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))) ||
    []

  const getLocaleLabel = (code: string) => {
    const locale = localization && localization.locales.find((l) => l.code === code)
    return locale && locale.label ? locale.label : code
  }

  const [copying, setCopying] = React.useState(false)
  const [toLocale, setToLocale] = React.useState<null | string>(null)
  const [fromLocale, setFromLocale] = React.useState<null | string>(currentLocale)
  const [overwriteExisting, setOverwriteExisting] = React.useState(false)

  const copyLocaleData = useCallback(
    async ({ from, to }) => {
      const isCollection = Boolean(collectionSlug)
      const url = `${serverURL}${api}/${isCollection ? `${collectionSlug}/${id}` : `globals/${globalSlug}`}?depth=0&locale=${from}`
      const redirectURL = `${serverURL}${admin}/${isCollection ? `collections/${collectionSlug}/${id}` : `globals/${globalSlug}`}?locale=${to}`
      const method = isCollection ? 'PATCH' : 'POST'
      const action = url.replace(`locale=${from}`, `locale=${to}`)
      let data = {}
      setCopying(true)

      try {
        const fromLocaleReq = await fetch(url)
        const fromLocaleData = await fromLocaleReq.json()
        const toLocaleReq = await fetch(action)
        const toLocaleData = await toLocaleReq.json()
        const mergedData = overwriteExisting
          ? deepMergeWithCombinedArrays(toLocaleData, fromLocaleData)
          : deepMergeWithCombinedArrays(fromLocaleData, toLocaleData)

        data = mergedData
        await submit({
          action,
          method,
          overrides: {
            ...data,
            _status: 'draft',
          },
          skipValidation: true,
        })

        // wait for the data to be saved before redirecting
        await new Promise((resolve) => setTimeout(resolve, 100))
        setCopying(false)
        toggleModal(drawerSlug)
        router.push(redirectURL)
      } catch (error) {
        toast.error(error.message)
      }
    },
    [collectionSlug, globalSlug, id, serverURL, api, admin, submit, overwriteExisting],
  )

  if (!id && !globalSlug) {
    return null
  }

  return (
    <React.Fragment>
      <PopupList.Button
        id={`${baseClass}__button`}
        onClick={() => {
          if (modified) {
            toast.info(t('general:unsavedChanges'))
          } else {
            toggleModal(drawerSlug)
          }
        }}
      >
        {t('localization:copyToLocale')}
      </PopupList.Button>
      <Drawer
        className={baseClass}
        gutter={false}
        Header={
          <DrawerHeader
            onClose={() => {
              toggleModal(drawerSlug)
            }}
            title={t('localization:copyToLocale')}
          />
        }
        slug={drawerSlug}
      >
        <div className={`${baseClass}__sub-header`}>
          <span>
            {fromLocale && toLocale ? (
              <div>
                {t('localization:copyFromTo', {
                  from: getLocaleLabel(fromLocale),
                  to: getLocaleLabel(toLocale),
                })}
              </div>
            ) : (
              t('localization:selectLocaleToCopy')
            )}
          </span>
          <Button
            buttonStyle="pill"
            disabled={!fromLocale || !toLocale}
            iconPosition="left"
            onClick={async () => {
              if (fromLocale === toLocale) {
                toast.error(t('localization:cannotCopySameLocale'))
                return
              }
              if (!copying) {
                await copyLocaleData({
                  from: fromLocale,
                  to: toLocale,
                })
              }
            }}
            size="small"
          >
            {copying ? t('general:copying') + '...' : t('general:copy')}
          </Button>
        </div>

        <div className={`${baseClass}__content`}>
          <SelectField
            field={{
              name: 'fromLocale',
              label: t('localization:copyFrom'),
              options: localeOptions,
            }}
            onChange={(val: string) => setFromLocale(val)}
            path="fromLocale"
            value={fromLocale}
          />
          <SelectField
            field={{
              name: 'toLocale',
              label: t('localization:copyTo'),
              options: localeOptions,
            }}
            onChange={(val: string) => setToLocale(val)}
            path="toLocale"
            value={toLocale}
          />
          <CheckboxField
            checked={overwriteExisting}
            field={{
              name: 'overwriteExisting',
              label: t('general:overwriteExistingData'),
            }}
            onChange={() => setOverwriteExisting(!overwriteExisting)}
            path={'overwriteExisting'}
          />
        </div>
      </Drawer>
    </React.Fragment>
  )
}
