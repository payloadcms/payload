import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Chevron } from '../..'
import { requests } from '../../../api'
import { Gutter } from '../../elements/Gutter'
import TextInput from '../../forms/field-types/Text/Input'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import './index.scss'

const chars = {
  leftCurlyBracket: '\u007B',
  leftSquareBracket: '\u005B',
  rightCurlyBracket: '\u007D',
  rightSquareBracket: '\u005D',
}

const baseClass = 'query-inspector'

const Bracket = ({
  comma = false,
  position,
  type,
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

  return (
    <li>
      <button
        aria-label="toggle"
        className={`${baseClass}__list-toggle ${isEmpty ? `${baseClass}__list-toggle--empty` : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isEmpty ? null : (
          <Chevron
            className={`${baseClass}__toggle-icon ${baseClass}__toggle-icon--${
              isOpen ? 'open' : 'closed'
            }`}
          />
        )}
        <li>
          {objectKey && `"${objectKey}": `}
          <Bracket position="start" type={parentType} />
          {isEmpty ? <Bracket comma={trailingComma} position="end" type={parentType} /> : null}
        </li>
      </button>

      <ul className={`${baseClass}__data-wrap`}>
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
            } else {
              type = 'string'
            }

            if (type === 'object' || type === 'array') {
              return (
                <RecursivelyRenderObjectData
                  isEmpty={value.length === 0 || Object.keys(value).length === 0}
                  object={value}
                  objectKey={key}
                  parentType={type === 'array' ? 'array' : 'object'}
                  trailingComma={!isLastKey}
                />
              )
            }

            if (type === 'date' || type === 'string' || type === 'null' || type === 'number') {
              return (
                <li className={`${baseClass}__row-line ${baseClass}__data-type--${type}`}>
                  {parentType === 'object' ? <span>{`"${key}": `}</span> : null}

                  {type === 'string' ? (
                    <span className={`${baseClass}__value`}>{`"${value}"`}</span>
                  ) : (
                    <span className={`${baseClass}__value`}>{value}</span>
                  )}
                  {isLastKey ? '' : ','}
                </li>
              )
            }
          })}
      </ul>

      {!isEmpty && (
        <li>
          <Bracket comma={trailingComma} position="end" type={parentType} />
        </li>
      )}
    </li>
  )
}

export const API = () => {
  const { id, collection } = useDocumentInfo()
  const { serverURL } = useConfig()
  const { i18n } = useTranslation()

  const [data, setData] = React.useState<any>({})
  const [query, setQuery] = React.useState<string>('')

  React.useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const request = await requests.get(
          `${serverURL}/api/${collection.slug}/${id}${query ? `${query}` : ''}`,
          {
            headers: {
              'Accept-Language': i18n.language,
            },
          },
        )

        const json = await request.json()
        setData(json)
      }
    }

    fetchData()
  }, [id, collection, serverURL, i18n.language, query])

  return (
    <Gutter className={baseClass} right={false}>
      <div className={`${baseClass}__configuration`}>
        <h3 className={`${baseClass}__configuration-title`}>Query Builder</h3>
        <TextInput
          name="query"
          onChange={(e) => setQuery(e.target.value)}
          path="query"
          placeholder="?depth=1"
          value={query}
        />
      </div>

      <div className={`${baseClass}__results-container`}>
        <RecursivelyRenderObjectData object={data} />
      </div>
    </Gutter>
  )
}
