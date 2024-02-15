'use client'
import * as React from 'react'

import {
  CopyToClipboard,
  Gutter,
  Checkbox,
  SetDocumentStepNav as SetStepNav,
  Form,
  Select,
  Number as NumberInput,
  EditViewProps,
  useConfig,
  MinimizeMaximize,
  useActions,
  useTranslation,
  useLocale,
} from '@payloadcms/ui'
import { RenderJSON } from './RenderJSON'
import { useSearchParams } from 'next/navigation'
import qs from 'qs'
import { toast } from 'react-toastify'
import './index.scss'

const baseClass = 'query-inspector'

export const APIViewClient: React.FC<EditViewProps> = (props) => {
  const { data: initialData } = props

  const searchParams = useSearchParams()
  const { setViewActions } = useActions()
  const { i18n } = useTranslation()
  const { code } = useLocale()

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
    collections,
    globals,
  } = useConfig()

  const collectionConfig =
    'collectionSlug' in props &&
    collections.find((collection) => collection.slug === props.collectionSlug)

  const globalConfig =
    'globalSlug' in props && globals.find((global) => global.slug === props.globalSlug)

  const id = 'id' in props ? props.id : undefined

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

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
      locale,
      draft,
      depth,
    },
    { addQueryPrefix: true },
  )}`

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(fetchURL, {
          method: 'GET',
          credentials: authenticated ? 'include' : 'omit',
          headers: {
            'Accept-Language': i18n.language,
          },
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

    fetchData()
  }, [i18n.language, fetchURL, authenticated])

  React.useEffect(() => {
    const editConfig = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit
    const apiActions =
      editConfig && 'API' in editConfig && 'actions' in editConfig.API ? editConfig.API.actions : []

    setViewActions(apiActions)

    return () => {
      setViewActions([])
    }
  }, [collectionConfig, globalConfig, setViewActions])

  return (
    <Gutter
      className={[baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' ')}
      right={false}
    >
      <SetStepNav
        collectionSlug={collectionSlug}
        useAsTitle={collectionConfig?.admin?.useAsTitle}
        pluralLabel={collectionConfig?.labels.plural}
        globalLabel={globalConfig?.label}
        globalSlug={globalSlug}
        id={id}
        isEditing={isEditing}
        view="API"
      />
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
              value: authenticated || false,
              initialValue: authenticated || false,
              valid: true,
            },
            draft: {
              value: draft || false,
              initialValue: draft || false,
              valid: true,
            },
            depth: {
              value: Number(depth || 0),
              initialValue: Number(depth || 0),
              valid: true,
            },
            locale: {
              value: locale,
              initialValue: locale,
              valid: true,
            },
          }}
        >
          <div className={`${baseClass}__form-fields`}>
            <div className={`${baseClass}__filter-query-checkboxes`}>
              {draftsEnabled && (
                <Checkbox
                  name="draft"
                  path="draft"
                  label="Draft"
                  onChange={() => setDraft(!draft)}
                />
              )}
              <Checkbox
                name="authenticated"
                path="authenticated"
                label="Authenticated"
                onChange={() => setAuthenticated(!authenticated)}
              />
            </div>
            {localeOptions && (
              <Select
                label="Locale"
                name="locale"
                options={localeOptions}
                path="locale"
                onChange={(value) => setLocale(value)}
              />
            )}
            <NumberInput
              label="Depth"
              name="depth"
              path="depth"
              min={0}
              max={10}
              step={1}
              onChange={(value) => setDepth(value.toString())}
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
