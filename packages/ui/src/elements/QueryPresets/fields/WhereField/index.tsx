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
    if (!condition || typeof condition !== 'object') {
      return 'No where query'
    }

    const key = Object.keys(condition)[0]

    if (!key || !condition[key] || typeof condition[key] !== 'object') {
      return 'No where query'
    }

    const operator = Object.keys(condition[key])[0]
    const operatorValue = condition[key][operator]

    // Format value - ideally would use field schema for proper typing
    const formatValue = (val: any): string => {
      if (typeof val === 'object' && val != null) {
        try {
          return new Date(val).toLocaleDateString()
        } catch {
          return 'Unknown error has occurred'
        }
      }
      return val?.toString() ?? ''
    }

    const value = Array.isArray(operatorValue)
      ? operatorValue.map(formatValue).join(', ')
      : formatValue(operatorValue)

    return (
      <Pill pillStyle="always-white" size="small">
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
}) => {
  const { path, value } = useField()
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
              getTranslation(collectionConfig?.labels?.plural, i18n),
            )
          : 'No where query'}
      </div>
    </div>
  )
}
