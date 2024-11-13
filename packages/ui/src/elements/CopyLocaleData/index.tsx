'use client'

import { useModal } from '@faceless-ui/modal'
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
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { code: currentLocale } = useLocale()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()
  const { toggleModal } = useModal()
  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  const [copying, setCopying] = React.useState(false)
  const [toLocale, setToLocale] = React.useState<null | string>(null)
  const [fromLocale, setFromLocale] = React.useState<null | string>(currentLocale)
  const [overwriteExisting, setOverwriteExisting] = React.useState(false)

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
        const action = url.replace(`locale=${from}`, `locale=${to}`)

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
        // toggleModal(drawerSlug)

        // if (response.ok) {
        //   window.open(redirect, '_self')
        // }
      } catch (error) {
        toast.error(error.message)
      }
    },
    [collectionSlug, globalSlug, submit, serverURL, api, id, toggleModal],
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
        Copy to Locale
      </PopupList.Button>
      <Drawer
        className={baseClass}
        gutter={false}
        Header={
          <DrawerHeader
            onClose={() => {
              toggleModal(drawerSlug)
            }}
            title="Copy to Locale"
          />
        }
        slug={drawerSlug}
      >
        <div className={`${baseClass}__sub-header`}>
          {/* TODO: translate */}
          <span>
            {fromLocale && toLocale ? (
              <div>
                Copying from <strong>{fromLocale}</strong> to <strong>{toLocale}</strong>
              </div>
            ) : (
              'Select locale to copy'
            )}
          </span>
          <Button
            buttonStyle="pill"
            disabled={!fromLocale || !toLocale}
            iconPosition="left"
            onClick={async () => {
              if (fromLocale === toLocale) {
                toast.error('Cannot copy to the same locale')
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
          <div>
            Copy From
            <SelectField
              defaultValue={
                fromLocale
                  ? {
                      label: localeOptions.find((option) => option.value === fromLocale)?.label,
                      value: fromLocale,
                    }
                  : undefined
              }
              field={{
                name: 'fromLocale',
                options: localeOptions,
              }}
              onChange={(value: string) => setFromLocale(value)}
            />
          </div>
          <div>
            Copy To
            <SelectField
              field={{
                name: 'toLocale',
                options: localeOptions,
              }}
              onChange={(value: string) => setToLocale(value)}
            />
          </div>
          <div>
            <CheckboxField
              checked={overwriteExisting}
              field={{
                name: 'overwriteExisting',
                label: 'Overwrite existing field data',
              }}
              onChange={() => setOverwriteExisting(!overwriteExisting)}
            />
          </div>
        </div>
      </Drawer>
    </React.Fragment>
  )
}
