'use client'
import { ChevronIcon } from '@payloadcms/ui'
import * as React from 'react'

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
  object: any[] | Record<string, any>
  objectKey?: string
  parentType?: 'array' | 'object'
  trailingComma?: boolean
}

export const RenderJSON = ({
  isEmpty = false,
  object,
  objectKey,
  parentType = 'object',
  trailingComma = false,
}: Args) => {
  const objectKeys = object ? Object.keys(object) : []
  const objectLength = objectKeys.length
  const [isOpen, setIsOpen] = React.useState<boolean>(true)
  const isNested = parentType === 'object' || parentType === 'array'
  return (
    <li className={isNested ? `${baseClass}__row-line--nested` : ''}>
      <button
        aria-label="toggle"
        className={`${baseClass}__list-toggle ${isEmpty ? `${baseClass}__list-toggle--empty` : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isEmpty ? null : (
          <ChevronIcon
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

      <ul
        className={`${baseClass}__json-children ${isNested ? `${baseClass}__json-children--nested` : ''}`}
      >
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
                <RenderJSON
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
        <span className={isNested ? `${baseClass}__bracket--nested` : ''}>
          <Bracket comma={trailingComma} position="end" type={parentType} />
        </span>
      )}
    </li>
  )
}
