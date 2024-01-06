import * as React from 'react'

import {
  CopyToClipboard,
  Gutter,
  CheckboxInput,
  SelectInput,
  MinimizeMaximize,
  useActions,
  useLocale,
  SetDocumentStepNav as SetStepNav,
} from '@payloadcms/ui'
// import { requests } from '../../../api'
import './index.scss'
import { initPage } from '../../utilities/initPage'
import { SanitizedConfig } from 'payload/types'

export const APIView = async ({
  collectionSlug,
  globalSlug,
  id,
  config: configPromise,
  searchParams,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user } = await initPage({
    configPromise,
    redirectUnauthenticatedUser: true,
    collectionSlug,
    globalSlug,
  })

  // const { i18n } = useTranslation()

  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const { code } = useLocale()
  const url = createURL(apiURL)

  const { setViewActions } = useActions()

  const docEndpoint = global ? `/globals/${global.slug}` : `/${collectionSlug}/${id}`

  const [data, setData] = React.useState<any>({})
  const [draft, setDraft] = React.useState<boolean>(url.searchParams.get('draft') === 'true')
  const [locale, setLocale] = React.useState<string>(url.searchParams.get('locale') || code)
  const [depth, setDepth] = React.useState<string>(url.searchParams.get('depth') || '1')
  const [authenticated, setAuthenticated] = React.useState<boolean>(true)
  const [fullscreen, setFullscreen] = React.useState<boolean>(false)

  const fetchURL = `${serverURL}${api}${docEndpoint}?locale=${locale}&draft=${draft}&depth=${depth}`

  // React.useEffect(() => {
  //   const fetchData = async () => {
  //     const request = await requests.get(fetchURL, {
  //       credentials: authenticated ? 'include' : 'omit',
  //       headers: {
  //         'Accept-Language': i18n.language,
  //       },
  //     })

  //     const json = await request.json()
  //     setData(json)
  //   }

  //   fetchData()
  // }, [i18n.language, fetchURL, authenticated])

  // React.useEffect(() => {
  //   const editConfig = (collection || global)?.admin?.components?.views?.Edit
  //   const apiActions =
  //     editConfig && 'API' in editConfig && 'actions' in editConfig.API ? editConfig.API.actions : []

  //   setViewActions(apiActions)
  // }, [collection, global, setViewActions])

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  const classes = [baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' ')

  let isEditing: boolean

  if ('collection' in props) {
    isEditing = props?.isEditing
  }

  return (
    <Gutter className={classes} right={false}>
      <SetStepNav
        collection={collection}
        global={global}
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
        <div className={`${baseClass}__form-fields`}>
          <div className={`${baseClass}__filter-query-checkboxes`}>
            {draftsEnabled && (
              <CheckboxInput
                checked={draft}
                id="draft-checkbox"
                label="Draft"
                onChange={() => setDraft(!draft)}
              />
            )}
            <CheckboxInput
              checked={authenticated}
              id="auth-checkbox"
              label="Authenticated"
              onChange={() => setAuthenticated(!authenticated)}
            />
          </div>
          {localeOptions && (
            <SelectInput
              defaultValue={{
                label: locale,
                value: locale,
              }}
              label="Locale"
              name="locale"
              onChange={(e) => setLocale(e.value as string)}
              options={localeOptions}
              path="locale"
            />
          )}
          <SelectInput
            defaultValue={{
              label: depth,
              value: depth,
            }}
            label="Depth"
            name="depth"
            onChange={(e) => setDepth(e.value as string)}
            options={[
              {
                label: '0',
                value: '0',
              },
              {
                label: '1',
                value: '1',
              },
              {
                label: '2',
                value: '2',
              },
              {
                label: '3',
                value: '3',
              },
              {
                label: '4',
                value: '4',
              },
            ]}
            path="depth"
          />
        </div>
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
          <RecursivelyRenderObjectData object={data} />
        </div>
      </div>
    </Gutter>
  )
}
