'use client'
import type { ClientField, Field, SanitizedCollectionConfig } from 'payload'

import { isFieldDisabled } from 'payload/shared'
import React, { useMemo } from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Popup } from '../Popup/index.js'
import { GroupByPopup } from './Popup.js'

export type GroupByButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields: ClientField[]
  /** Called with the next `groupBy` value (prefixed with `-` for descending). */
  readonly onChange: (groupBy: string) => void
  /** The current `groupBy` value (prefixed with `-` for descending). */
  readonly value: string
}

const baseClass = 'group-by-control'

/**
 * Supported field types for group by functionality.
 */
const supportedFieldTypes: Field['type'][] = [
  'text',
  'textarea',
  'number',
  'select',
  'relationship',
  'date',
  'checkbox',
  'radio',
  'email',
  'upload',
]

export const GroupByButton: React.FC<GroupByButtonProps> = ({
  collectionSlug,
  fields,
  onChange,
  value,
}) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()

  const groupByFieldName = value?.replace(/^-/, '')

  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields

  const reducedFields = useMemo(
    () =>
      reduceFieldsToOptions({
        fieldPermissions,
        fields,
        i18n,
      }),
    [fields, fieldPermissions, i18n],
  )

  const filteredFields = useMemo(
    () =>
      reducedFields.filter(
        (field) =>
          !isFieldDisabled(field.field, 'groupBy') &&
          field.fieldPath !== 'id' &&
          supportedFieldTypes.includes(field.field.type),
      ),
    [reducedFields],
  )

  const groupByField = reducedFields.find((field) => field.fieldPath === groupByFieldName)
  const isActive = Boolean(groupByFieldName && groupByField)

  if (filteredFields.length === 0) {
    return null
  }

  const triggerLabel = isActive
    ? t('general:groupByLabel', { label: groupByField?.label || '' })
    : t('general:groupByLabel', { label: '' })

  return (
    <Popup
      className={baseClass}
      horizontalAlign="right"
      portalClassName={`${baseClass}__popup`}
      render={({ close }) => (
        <GroupByPopup
          close={close}
          filteredFields={filteredFields}
          groupByField={groupByField}
          groupByFieldName={groupByFieldName}
          isActive={isActive}
          onChange={onChange}
          value={value}
        />
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          buttonStyle="secondary"
          className={`${baseClass}__trigger`}
          extraButtonProps={{ onKeyDown }}
          icon={<ChevronIcon direction={active ? 'up' : 'down'} size={16} />}
          id="toggle-group-by"
          onClick={onClick}
          selected={active || isActive}
          size="medium"
          {...ariaProps}
        >
          {triggerLabel}
        </Button>
      )}
      size="large"
      theme="auto"
      verticalAlign="bottom"
    />
  )
}
