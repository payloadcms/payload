import * as React from 'react'
import { useTranslation } from 'react-i18next'

import type { EditViewProps } from '../types'

import { Chevron } from '../..'
import { requests } from '../../../api'
import CopyToClipboard from '../../elements/CopyToClipboard'
import { Gutter } from '../../elements/Gutter'
import { CheckboxInput } from '../../forms/field-types/Checkbox/Input'
import SelectInput from '../../forms/field-types/Select/Input'
import { MinimizeMaximize } from '../../icons/MinimizeMaximize'
import { useActions } from '../../utilities/ActionsProvider'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import { SetStepNav } from '../collections/Edit/SetStepNav'
import './index.scss'

const chars = {
  leftCurlyBracket: '\u007B',
  leftSquareBracket: '\u005B',
  rightCurlyBracket: '\u007D',
  rightSquareBracket: '\u005D',
}

const baseClass = 'query-inspector'

const Bracket = ({
  type,
  comma = false,
  position,
}: {
  comma?: boolean
  position: 'end' | 'start'
  type: 'array' | 'object'
}) => {
  const rightBracket = type === 'object' ? chars.rightCurlyBracket : chars.rightSquareBracket
  const leftBracket = type === 'object' ? chars.leftCurlyBracket : chars.leftSquareBracket
  const bracketToRender = position === 'end' ? rightBracket : leftBracket
  return (
    <span className={`${baseClass}__bracket ${baseClass}__bracket--position-${position}`}>
      {bracketToRender}
      {position === 'end' && comma ? ',' : null}
    </span>
  )
}

type Args = {
  isEmpty?: boolean
  object: Record<string, any> | any[]
  objectKey?: string
  parentType?: 'array' | 'object'
  trailingComma?: boolean
}

const RecursivelyRenderObjectData = ({
  isEmpty = false,
  object,
  objectKey,
  parentType = 'object',
  trailingComma = false,
}: Args) => {
  const objectKeys = Object.keys(object)
  const objectLength = objectKeys.length
  const [isOpen, setIsOpen] = React.useState<boolean>(true)
  const isNestedAndEmpty = isEmpty && (parentType === 'object' || parentType === 'array')
  return (
    <li className={isNestedAndEmpty ? `${baseClass}__row-line--nested` : ''}>
      <button
        aria-label="toggle"
        className={`${baseClass}__list-toggle ${isEmpty ? `${baseClass}__list-toggle--empty` : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isEmpty ? null : (
          <Chevron
            className={`${baseClass}__toggle-row-icon ${baseClass}__toggle-row-icon--${
              isOpen ? 'open' : 'closed'
            }`}
          />
        )}
        <span>
          {objectKey && `"${objectKey}": `}
          <Bracket position="start" type={parentType} />
          {isEmpty ? <Bracket comma={trailingComma} position="end" type={parentType} /> : null}
        </span>
      </button>

      <ul className={`${baseClass}__json-children`}>
        {isOpen &&
          objectKeys.map((key, keyIndex) => {
            let value = object[key]
            let type = 'string'
            const isLastKey = keyIndex === objectLength - 1

            if (value === null) {
              type = 'null'
            } else if (value instanceof Date) {
              type = 'date'
              value = value.toISOString()
            } else if (Array.isArray(value)) {
              type = 'array'
            } else if (typeof value === 'object') {
              type = 'object'
            } else if (typeof value === 'number') {
              type = 'number'
            } else if (typeof value === 'boolean') {
              type = 'boolean'
            } else {
              type = 'string'
            }

            if (type === 'object' || type === 'array') {
              return (
                <RecursivelyRenderObjectData
                  isEmpty={value.length === 0 || Object.keys(value).length === 0}
                  key={`${key}-${keyIndex}`}
                  object={value}
                  objectKey={parentType === 'object' ? key : undefined}
                  parentType={type}
                  trailingComma={!isLastKey}
                />
              )
            }

            if (
              type === 'date' ||
              type === 'string' ||
              type === 'null' ||
              type === 'number' ||
              type === 'boolean'
            ) {
              const parentHasKey = Boolean(parentType === 'object' && key)

              const rowClasses = [
                `${baseClass}__row-line`,
                `${baseClass}__value-type--${type}`,
                `${baseClass}__row-line--${objectKey ? 'nested' : 'top'}`,
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <li className={rowClasses} key={`${key}-${keyIndex}`}>
                  {parentHasKey ? <span>{`"${key}": `}</span> : null}

                  <span className={`${baseClass}__value`}>{JSON.stringify(value)}</span>
                  {isLastKey ? '' : ','}
                </li>
              )
            }
          })}
      </ul>

      {!isEmpty && (
        <span>
          <Bracket comma={trailingComma} position="end" type={parentType} />
        </span>
      )}
    </li>
  )
}

function createURL(url: string) {
  if (url.startsWith('/')) {
    const domain = window.location.origin
    return new URL(url, domain)
  } else {
    return new URL(url)
  }
}

export const API: React.FC<EditViewProps> = (props) => {
  const { apiURL } = props
  const { i18n, t } = useTranslation()
  const {
    localization,
    routes: { api },
    serverURL,
  } = useConfig()
  const { id, collection, global } = useDocumentInfo()
  const { code } = useLocale()
  const url = createURL(apiURL)

  const { setViewActions } = useActions()

  const draftsEnabled = collection?.versions?.drafts || global?.versions?.drafts
  const docEndpoint = global ? `/globals/${global.slug}` : `/${collection.slug}/${id}`

  const [data, setData] = React.useState<any>({})
  const [draft, setDraft] = React.useState<boolean>(url.searchParams.get('draft') === 'true')
  const [locale, setLocale] = React.useState<string>(url.searchParams.get('locale') || code)
  const [depth, setDepth] = React.useState<string>(url.searchParams.get('depth') || '1')
  const [authenticated, setAuthenticated] = React.useState<boolean>(true)
  const [fullscreen, setFullscreen] = React.useState<boolean>(false)

  const fetchURL = `${serverURL}${api}${docEndpoint}?locale=${locale}&draft=${draft}&depth=${depth}`

  React.useEffect(() => {
    const fetchData = async () => {
      const request = await requests.get(fetchURL, {
        credentials: authenticated ? 'include' : 'omit',
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      const json = await request.json()
      setData(json)
    }

    fetchData()
  }, [i18n.language, fetchURL, authenticated])

  React.useEffect(() => {
    const editConfig = (collection || global)?.admin?.components?.views?.Edit
    const apiActions =
      editConfig && 'API' in editConfig && 'actions' in editConfig.API ? editConfig.API.actions : []

    setViewActions(apiActions)

    return () => {
      setViewActions([])
    }
  }, [collection, global, setViewActions])

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
                label={t('version:draft')}
                onToggle={() => setDraft(!draft)}
              />
            )}
            <CheckboxInput
              checked={authenticated}
              id="auth-checkbox"
              label={t('authentication:authenticated')}
              onToggle={() => setAuthenticated(!authenticated)}
            />
          </div>

          {localeOptions && (
            <SelectInput
              defaultValue={{
                label: locale,
                value: locale,
              }}
              label={t('general:locale')}
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
            label={t('general:depth')}
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
