'use client'

import { CopyToClipboard } from '@payloadcms/ui/elements/CopyToClipboard'
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { Checkbox } from '@payloadcms/ui/fields/Checkbox'
import { NumberField as NumberInput } from '@payloadcms/ui/fields/Number'
import { Select } from '@payloadcms/ui/fields/Select'
import { Form } from '@payloadcms/ui/forms/Form'
import { MinimizeMaximize } from '@payloadcms/ui/icons/MinimizeMaximize'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useLocale } from '@payloadcms/ui/providers/Locale'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { useSearchParams } from 'next/navigation.js'
import qs from 'qs'
import * as React from 'react'
import { toast } from 'react-toastify'

import { SetDocumentStepNav } from '../Edit/Default/SetDocumentStepNav/index.js'
import { RenderJSON } from './RenderJSON/index.js'
import './index.scss'

const baseClass = 'query-inspector'

export const APIViewClient: React.FC = () => {
  const { id, collectionSlug, globalSlug, initialData } = useDocumentInfo()

  const searchParams = useSearchParams()
  const { i18n, t } = useTranslation()
  const { code } = useLocale()

  const { getComponentMap } = useComponentMap()

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  const {
    collections,
    globals,
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = useConfig()

  const collectionConfig =
    collectionSlug && collections.find((collection) => collection.slug === collectionSlug)

  const globalConfig = globalSlug && globals.find((global) => global.slug === globalSlug)

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  let draftsEnabled: boolean = false
  let docEndpoint: string = ''

  if (collectionConfig) {
    draftsEnabled = Boolean(collectionConfig.versions?.drafts)
    docEndpoint = `/${collectionSlug}/${id}`
  }

  if (globalConfig) {
    draftsEnabled = Boolean(globalConfig.versions?.drafts)
    docEndpoint = `/globals/${globalSlug}`
  }

  const [data, setData] = React.useState<any>(initialData)
  const [draft, setDraft] = React.useState<boolean>(searchParams.get('draft') === 'true')
  const [locale, setLocale] = React.useState<string>(searchParams?.get('locale') || code)
  const [depth, setDepth] = React.useState<string>(searchParams.get('depth') || '1')
  const [authenticated, setAuthenticated] = React.useState<boolean>(true)
  const [fullscreen, setFullscreen] = React.useState<boolean>(false)

  const fetchURL = `${serverURL}${apiRoute}${docEndpoint}${qs.stringify(
    {
      depth,
      draft,
      locale,
    },
    { addQueryPrefix: true },
  )}`

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(fetchURL, {
          credentials: authenticated ? 'include' : 'omit',
          headers: {
            'Accept-Language': i18n.language,
          },
          method: 'GET',
        })

        try {
          const json = await res.json()
          setData(json)
        } catch (error) {
          toast.error('Error parsing response')
          console.error(error)
        }
      } catch (error) {
        toast.error('Error making request')
        console.error(error)
      }
    }

    void fetchData()
  }, [i18n.language, fetchURL, authenticated])

  return (
    <Gutter
      className={[baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' ')}
      right={false}
    >
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalLabel={globalConfig?.label}
        globalSlug={globalSlug}
        id={id}
        pluralLabel={collectionConfig ? collectionConfig?.labels?.plural : undefined}
        useAsTitle={collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined}
        view="API"
      />
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.API} />
      <div className={`${baseClass}__configuration`}>
        <div className={`${baseClass}__api-url`}>
          <span className={`${baseClass}__label`}>
            API URL <CopyToClipboard value={fetchURL} />
          </span>
          <a href={fetchURL} rel="noopener noreferrer" target="_blank">
            {fetchURL}
          </a>
        </div>
        <Form
          initialState={{
            authenticated: {
              initialValue: authenticated || false,
              valid: true,
              value: authenticated || false,
            },
            depth: {
              initialValue: Number(depth || 0),
              valid: true,
              value: Number(depth || 0),
            },
            draft: {
              initialValue: draft || false,
              valid: true,
              value: draft || false,
            },
            locale: {
              initialValue: locale,
              valid: true,
              value: locale,
            },
          }}
        >
          <div className={`${baseClass}__form-fields`}>
            <div className={`${baseClass}__filter-query-checkboxes`}>
              {draftsEnabled && (
                <Checkbox
                  label={t('version:draft')}
                  name="draft"
                  onChange={() => setDraft(!draft)}
                  path="draft"
                />
              )}
              <Checkbox
                label={t('authentication:authenticated')}
                name="authenticated"
                onChange={() => setAuthenticated(!authenticated)}
                path="authenticated"
              />
            </div>
            {localeOptions && (
              <Select
                label={t('general:locale')}
                name="locale"
                onChange={(value) => setLocale(value)}
                options={localeOptions}
                path="locale"
              />
            )}
            <NumberInput
              label={t('general:depth')}
              max={10}
              min={0}
              name="depth"
              onChange={(value) => setDepth(value?.toString())}
              path="depth"
              step={1}
            />
          </div>
        </Form>
      </div>
      <div className={`${baseClass}__results-wrapper`}>
        <div className={`${baseClass}__toggle-fullscreen-button-container`}>
          <button
            aria-label="toggle fullscreen"
            className={`${baseClass}__toggle-fullscreen-button`}
            onClick={() => setFullscreen(!fullscreen)}
            type="button"
          >
            <MinimizeMaximize isMinimized={!fullscreen} />
          </button>
        </div>
        <div className={`${baseClass}__results`}>
          <RenderJSON object={data} />
        </div>
      </div>
    </Gutter>
  )
}
