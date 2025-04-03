'use client'
import type { JSONFieldClientComponent, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'
import React from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useListQuery } from '../../../../providers/ListQuery/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Pill } from '../../../Pill/index.js'
import './index.scss'

/** @todo: improve this */
const transformWhereToNaturalLanguage = (
  where: Where,
  collectionLabel: string,
): React.ReactNode => {
  if (!where) {
    return null
  }

  const renderCondition = (condition: any): React.ReactNode => {
    const key = Object.keys(condition)[0]

    if (!condition[key]) {
      return 'No where query'
    }

    const operator = Object.keys(condition[key])[0]
    let value = condition[key][operator]

    // TODO: this is not right, but works for now at least.
    // Ideally we look up iterate _fields_ so we know the type of the field
    // Currently, we're only iterating over the `where` field's value, so we don't know the type
    if (typeof value === 'object') {
      try {
        value = new Date(value).toLocaleDateString()
      } catch (_err) {
        value = 'Unknown error has occurred'
      }
    }

    return (
      <Pill pillStyle="always-white">
        <b>{toWords(key)}</b> {operator} <b>{toWords(value)}</b>
      </Pill>
    )
  }

  const renderWhere = (where: Where, collectionLabel: string): React.ReactNode => {
    if (where.or && where.or.length > 0) {
      return (
        <div className="or-condition">
          {where.or.map((orCondition, orIndex) => (
            <React.Fragment key={orIndex}>
              {orCondition.and && orCondition.and.length > 0 ? (
                <div className="and-condition">
                  {orIndex === 0 && (
                    <span className="label">{`Filter ${collectionLabel} where `}</span>
                  )}
                  {orIndex > 0 && <span className="label"> or </span>}
                  {orCondition.and.map((andCondition, andIndex) => (
                    <React.Fragment key={andIndex}>
                      {renderCondition(andCondition)}
                      {andIndex < orCondition.and.length - 1 && (
                        <span className="label"> and </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                renderCondition(orCondition)
              )}
            </React.Fragment>
          ))}
        </div>
      )
    }

    return renderCondition(where)
  }

  return renderWhere(where, collectionLabel)
}

export const QueryPresetsWhereField: JSONFieldClientComponent = ({
  field: { label, required },
  path,
}) => {
  const { value } = useField({ path })
  const { collectionSlug } = useListQuery()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { i18n } = useTranslation()

  return (
    <div className="field-type query-preset-where-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <div className="value-wrapper">
        {value
          ? transformWhereToNaturalLanguage(
              value as Where,
              getTranslation(collectionConfig.labels.plural, i18n),
            )
          : 'No where query'}
      </div>
    </div>
  )
}
