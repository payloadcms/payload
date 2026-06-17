'use client'
import type { ClientField, Field, SanitizedCollectionConfig } from 'payload'

import { isFieldDisabled } from 'payload/shared'
import React, { useCallback, useMemo, useRef } from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { TrashIcon } from '../../icons/Trash/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

export type GroupByControlProps = {
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

export const GroupByControl: React.FC<GroupByControlProps> = ({
  collectionSlug,
  fields,
  onChange,
  value,
}) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const closeRef = useRef<(() => void) | null>(null)

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

  const handleFieldSelect = useCallback(
    (fieldPath: string) => {
      onChange(value?.startsWith('-') ? `-${fieldPath}` : fieldPath)
    },
    [onChange, value],
  )

  const handleClear = useCallback(() => {
    onChange('')
    closeRef.current?.()
  }, [onChange])

  const handleDirectionSelect = useCallback(
    (direction: 'asc' | 'desc') => {
      if (!groupByFieldName) {
        return
      }
      onChange(direction === 'asc' ? groupByFieldName : `-${groupByFieldName}`)
    },
    [groupByFieldName, onChange],
  )

  if (filteredFields.length === 0) {
    return null
  }

  const directionValue =
    !value || typeof value !== 'string' ? 'asc' : value.startsWith('-') ? 'desc' : 'asc'

  // Build the trigger button label
  const triggerLabel = isActive
    ? t('general:groupByLabel', { label: groupByField?.label || '' })
    : t('general:groupByLabel', { label: '' })

  return (
    <Popup
      className={baseClass}
      horizontalAlign="right"
      portalClassName={`${baseClass}__popup`}
      render={({ close }) => {
        closeRef.current = close
        return (
          <div className={`${baseClass}__content`}>
            <div className={`${baseClass}__header`}>
              <span className={`${baseClass}__title`}>
                {t('general:groupByLabel', { label: '' })}
              </span>
              <div className={`${baseClass}__header-actions`}>
                {isActive && (
                  <Button
                    aria-label={t('general:clear')}
                    buttonStyle="ghost"
                    icon={<TrashIcon />}
                    onClick={handleClear}
                    round
                    size="medium"
                  />
                )}
                <Button
                  aria-label={t('general:close')}
                  buttonStyle="ghost"
                  icon={<XIcon size={24} />}
                  onClick={close}
                  round
                  size="medium"
                />
              </div>
            </div>
            <div className={`${baseClass}__body`}>
              <div className={`${baseClass}__row`}>
                <label className={`${baseClass}__label`}>{t('general:field')}</label>
                <div className={`${baseClass}__input`} data-popup-prevent-close>
                  <Popup
                    className={`${baseClass}__select-popup`}
                    horizontalAlign="right"
                    render={({ close: closeFieldPopup }) => (
                      <PopupList.RadioGroup>
                        {filteredFields.map((field, i) => (
                          <PopupList.RadioGroupItem
                            active={field.fieldPath === groupByFieldName}
                            key={i}
                            onClick={() => {
                              handleFieldSelect(field.fieldPath)
                              closeFieldPopup()
                            }}
                          >
                            {field.label}
                          </PopupList.RadioGroupItem>
                        ))}
                      </PopupList.RadioGroup>
                    )}
                    renderButton={({ active, onClick, onKeyDown }) => (
                      <button
                        className={`${baseClass}__select-trigger`}
                        onClick={onClick}
                        onKeyDown={onKeyDown}
                        type="button"
                      >
                        <span className={`${baseClass}__select-value`}>
                          {groupByField?.label || t('general:selectValue')}
                        </span>
                        <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
                      </button>
                    )}
                    size="medium"
                    verticalAlign="bottom"
                  />
                </div>
              </div>
              <div className={`${baseClass}__row`}>
                <label className={`${baseClass}__label`}>{t('general:sort')}</label>
                <div className={`${baseClass}__input`} data-popup-prevent-close>
                  <Popup
                    className={`${baseClass}__select-popup`}
                    disabled={!groupByFieldName}
                    horizontalAlign="right"
                    render={({ close: closeSortPopup }) => (
                      <PopupList.RadioGroup>
                        <PopupList.RadioGroupItem
                          active={directionValue === 'desc'}
                          onClick={() => {
                            handleDirectionSelect('desc')
                            closeSortPopup()
                          }}
                        >
                          {t('general:descending')}
                        </PopupList.RadioGroupItem>
                        <PopupList.RadioGroupItem
                          active={directionValue === 'asc'}
                          onClick={() => {
                            handleDirectionSelect('asc')
                            closeSortPopup()
                          }}
                        >
                          {t('general:ascending')}
                        </PopupList.RadioGroupItem>
                      </PopupList.RadioGroup>
                    )}
                    renderButton={({ active, onClick, onKeyDown }) => (
                      <button
                        className={[
                          `${baseClass}__select-trigger`,
                          !groupByFieldName && `${baseClass}__select-trigger--disabled`,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={!groupByFieldName}
                        onClick={onClick}
                        onKeyDown={onKeyDown}
                        type="button"
                      >
                        <span className={`${baseClass}__select-value`}>
                          {directionValue === 'desc'
                            ? t('general:descending')
                            : t('general:ascending')}
                        </span>
                        <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
                      </button>
                    )}
                    size="small"
                    verticalAlign="bottom"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }}
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
