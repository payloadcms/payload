'use client'
import React, { useCallback, useId } from 'react'

import type { ReducedField } from '../WhereBuilder/types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { TrashIcon } from '../../icons/Trash/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './Popup.css'

export type GroupByPopupProps = {
  /** Closes the parent popup. */
  readonly close: () => void
  /** The selectable, permission-filtered fields. */
  readonly filteredFields: ReducedField[]
  /** The currently selected field, if any. */
  readonly groupByField?: ReducedField
  /** The selected field path with any leading `-` stripped. */
  readonly groupByFieldName?: string
  /** Whether a field is currently selected. */
  readonly isActive: boolean
  /** Called with the next `groupBy` value (prefixed with `-` for descending). */
  readonly onChange: (groupBy: string) => void
  /** The current `groupBy` value (prefixed with `-` for descending). */
  readonly value: string
}

const baseClass = 'group-by-control'

export const GroupByPopup: React.FC<GroupByPopupProps> = ({
  close,
  filteredFields,
  groupByField,
  groupByFieldName,
  isActive,
  onChange,
  value,
}) => {
  const { t } = useTranslation()
  const generatedId = useId()
  const fieldTriggerId = `group-by-field-trigger-${generatedId}`
  const sortTriggerId = `group-by-sort-trigger-${generatedId}`

  const directionValue =
    !value || typeof value !== 'string' ? 'asc' : value.startsWith('-') ? 'desc' : 'asc'

  const handleFieldSelect = useCallback(
    (fieldPath: string) => {
      onChange(value?.startsWith('-') ? `-${fieldPath}` : fieldPath)
    },
    [onChange, value],
  )

  const handleClear = useCallback(() => {
    onChange('')
    close()
  }, [onChange, close])

  const handleDirectionSelect = useCallback(
    (direction: 'asc' | 'desc') => {
      if (!groupByFieldName) {
        return
      }
      onChange(direction === 'asc' ? groupByFieldName : `-${groupByFieldName}`)
    },
    [groupByFieldName, onChange],
  )

  return (
    <div className={`${baseClass}__content`}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__title`}>{t('general:groupByLabel', { label: '' })}</span>
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
          <label className={`${baseClass}__label`} htmlFor={fieldTriggerId}>
            {t('general:field')}
          </label>
          <div className={`${baseClass}__input`} data-popup-prevent-close>
            <Popup
              className={`${baseClass}__select-popup`}
              horizontalAlign="right"
              popupType="menu"
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
              renderButton={({ active, ...buttonProps }) => (
                <button
                  {...buttonProps}
                  aria-label={t('general:field')}
                  className={`${baseClass}__select-trigger`}
                  id={fieldTriggerId}
                  type="button"
                >
                  <span className={`${baseClass}__select-value`}>
                    {groupByField?.label || t('general:selectValue')}
                  </span>
                  <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
                </button>
              )}
              verticalAlign="bottom"
            />
          </div>
        </div>
        <div className={`${baseClass}__row`}>
          <label className={`${baseClass}__label`} htmlFor={sortTriggerId}>
            {t('general:sort')}
          </label>
          <div className={`${baseClass}__input`} data-popup-prevent-close>
            <Popup
              className={`${baseClass}__select-popup`}
              disabled={!groupByFieldName}
              horizontalAlign="right"
              popupType="menu"
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
              renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
                <button
                  {...ariaProps}
                  aria-disabled={!groupByFieldName}
                  aria-label={t('general:sort')}
                  className={[
                    `${baseClass}__select-trigger`,
                    !groupByFieldName && `${baseClass}__select-trigger--disabled`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  id={sortTriggerId}
                  onClick={(event) => {
                    if (!groupByFieldName) {
                      event.preventDefault()
                      return
                    }
                    onClick(event)
                  }}
                  onKeyDown={(event) => {
                    if (!groupByFieldName) {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                      }
                      return
                    }
                    onKeyDown(event)
                  }}
                  type="button"
                >
                  <span className={`${baseClass}__select-value`}>
                    {directionValue === 'desc' ? t('general:descending') : t('general:ascending')}
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
}
