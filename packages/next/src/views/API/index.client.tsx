'use client'

import {
  Button,
  CheckboxField,
  CodeEditorLazy,
  ExternalLinkIcon,
  Form,
  MinimizeMaximizeIcon,
  NumberField,
  SetDocumentStepNav,
  TextInput,
  toast,
  useConfig,
  useDocumentInfo,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation.js'

import './index.css'

import { formatAdminURL, hasDraftsEnabled } from 'payload/shared'
import * as React from 'react'

import { LocaleSelector } from './LocaleSelector/index.js'

const baseClass = 'query-inspector'

export const APIViewClient: React.FC = () => {
  const { id, collectionSlug, globalSlug, initialData, isTrashed } = useDocumentInfo()

  const searchParams = useSearchParams()
  const { i18n, t } = useTranslation()
  const { code } = useLocale()

  const {
    config: {
      defaultDepth,
      localization,
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  let draftsEnabled: boolean = false
  let docEndpoint: `/${string}` = undefined

  if (collectionConfig) {
    draftsEnabled = hasDraftsEnabled(collectionConfig)
    docEndpoint = `/${collectionSlug}/${id}`
  }

  if (globalConfig) {
    draftsEnabled = hasDraftsEnabled(globalConfig)
    docEndpoint = `/globals/${globalSlug}`
  }

  const [data, setData] = React.useState<any>(initialData)
  const [draft, setDraft] = React.useState<boolean>(searchParams.get('draft') === 'true')
  const [locale, setLocale] = React.useState<string>(searchParams?.get('locale') || code)
  const [depth, setDepth] = React.useState<string>(
    searchParams.get('depth') || defaultDepth.toString(),
  )
  const [authenticated, setAuthenticated] = React.useState<boolean>(true)
  const [fullscreen, setFullscreen] = React.useState<boolean>(false)
  const [origin, setOrigin] = React.useState<string>(serverURL || '')

  const jsonString = React.useMemo(
    () => (data === undefined ? '' : JSON.stringify(data, null, 2)),
    [data],
  )

  // readOnly editors never fire onChange, so bump a counter to re-fit height on data change
  const [recalculatedHeightAt, setRecalculatedHeightAt] = React.useState(0)
  React.useEffect(() => {
    setRecalculatedHeightAt((count) => count + 1)
  }, [jsonString])

  // Set the origin to the window.location.origin in useEffect to avoid hydration errors
  React.useEffect(() => {
    if (!serverURL) {
      setOrigin(window.location.origin)
    }
  }, [serverURL])

  const trashParam = typeof initialData?.deletedAt === 'string'

  const params = new URLSearchParams({
    depth,
    draft: String(draft),
    locale,
    trash: trashParam ? 'true' : 'false',
  }).toString()

  const fetchURL = formatAdminURL({
    apiRoute,
    path: `${docEndpoint}?${params}`,
    serverURL: origin,
  })

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
          console.error(error) // eslint-disable-line no-console
        }
      } catch (error) {
        toast.error('Error making request')
        console.error(error) // eslint-disable-line no-console
      }
    }

    void fetchData()
  }, [i18n.language, fetchURL, authenticated])

  return (
    <div
      className={[baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' ')}
    >
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalLabel={globalConfig?.label}
        globalSlug={globalSlug}
        id={id}
        isTrashed={isTrashed}
        pluralLabel={collectionConfig ? collectionConfig?.labels?.plural : undefined}
        useAsTitle={collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined}
        view="API"
      />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__configuration`}>
          <div className={`${baseClass}__api-url`}>
            <span className={`${baseClass}__label`}>API URL</span>
            <Button
              aria-label={t('general:openInNewWindow')}
              buttonStyle="ghost"
              className={`${baseClass}__api-url-open-button`}
              el="anchor"
              icon={<ExternalLinkIcon size={16} />}
              margin={false}
              newTab
              url={fetchURL}
            />
          </div>
          <div className={`${baseClass}__api-url-field`}>
            <TextInput
              className={`${baseClass}__api-url-input`}
              htmlAttributes={{
                'aria-label': 'API URL',
                readOnly: true,
              }}
              path="api-url"
              readOnly={false}
              value={fetchURL}
            />
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
                  <CheckboxField
                    field={{
                      name: 'draft',
                      label: t('version:draft'),
                    }}
                    onChange={() => setDraft(!draft)}
                    path="draft"
                  />
                )}
                <CheckboxField
                  field={{
                    name: 'authenticated',
                    label: t('authentication:authenticated'),
                  }}
                  onChange={() => setAuthenticated(!authenticated)}
                  path="authenticated"
                />
              </div>
              {localeOptions && (
                <LocaleSelector localeOptions={localeOptions} onChange={setLocale} />
              )}
              <NumberField
                field={{
                  name: 'depth',
                  admin: {
                    step: 1,
                  },
                  label: t('general:depth'),
                  max: 10,
                  min: 0,
                }}
                onChange={(value) => setDepth(value?.toString())}
                path="depth"
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
              <MinimizeMaximizeIcon isMinimized={!fullscreen} />
            </button>
          </div>
          <div className={`${baseClass}__results`}>
            <CodeEditorLazy
              defaultLanguage="json"
              options={{ folding: true, lineNumbers: 'on', wordWrap: 'off' }}
              readOnly
              recalculatedHeightAt={recalculatedHeightAt}
              value={jsonString}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
