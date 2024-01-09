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
} from '@payloadcms/ui'
import './index.scss'
import { RenderJSON } from './RenderJSON'

const baseClass = 'query-inspector'

export const APIView: React.FC<EditViewProps> = async (props) => {
  const { config, searchParams, locale, data } = props

  const collectionConfig = 'collectionConfig' in props && props?.collectionConfig
  const globalConfig = 'globalConfig' in props && props?.globalConfig
  const id = 'id' in props ? props.id : undefined

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug
  const { depth, draft, authenticated } = searchParams

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  let draftsEnabled = false
  let docEndpoint = ''

  if (collectionConfig) {
    draftsEnabled = Boolean(collectionConfig.versions?.drafts)
    docEndpoint = `/${collectionSlug}/${id}`
  }

  if (globalConfig) {
    draftsEnabled = Boolean(globalConfig.versions?.drafts)
    docEndpoint = `/globals/${globalSlug}`
  }

  const fetchURL = `${serverURL}${apiRoute}${docEndpoint}?locale=${locale}&draft=${draft}&depth=${
    depth || 0
  }`

  return (
    <Gutter
      className={[
        baseClass,
        // fullscreen && `${baseClass}--fullscreen`
      ]
        .filter(Boolean)
        .join(' ')}
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
              {draftsEnabled && <Checkbox name="draft" path="draft" label="Draft" />}
              <Checkbox name="authenticated" path="authenticated" label="Authenticated" />
            </div>
            {localeOptions && (
              <Select label="Locale" name="locale" options={localeOptions} path="locale" />
            )}
            <NumberInput label="Depth" name="depth" path="depth" />
          </div>
        </Form>
      </div>
      <div className={`${baseClass}__results-wrapper`}>
        <div className={`${baseClass}__toggle-fullscreen-button-container`}>
          <button
            aria-label="toggle fullscreen"
            className={`${baseClass}__toggle-fullscreen-button`}
            // onClick={() => setFullscreen(!fullscreen)}
            type="button"
          >
            {/* <MinimizeMaximize isMinimized={!fullscreen} /> */}
          </button>
        </div>
        <div className={`${baseClass}__results`}>
          <RenderJSON object={data} />
        </div>
      </div>
    </Gutter>
  )
}
