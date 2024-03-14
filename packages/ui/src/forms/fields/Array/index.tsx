'use client'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { Props } from './types.js'

import Banner from '../../../elements/Banner/index.js'
import { Button } from '../../../elements/Button/index.js'
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import DraggableSortable from '../../../elements/DraggableSortable/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { scrollToID } from '../../../utilities/scrollToID.js'
import { useForm, useFormSubmitted } from '../../Form/context.js'
import LabelComp from '../../Label/index.js'
import { NullifyLocaleField } from '../../NullifyField/index.js'
import { useField } from '../../useField/index.js'
import { fieldBaseClass } from '../shared.js'
import { ArrayRow } from './ArrayRow.js'
import './index.scss'

const baseClass = 'array-field'

const ArrayFieldType: React.FC<Props> = (props) => {
  const {
    name,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    fieldMap,
    forceRender = false,
    indexPath,
    label,
    localized,
    path: pathFromProps,
    permissions,
    readOnly,
    required,
    validate,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const minRows = 'minRows' in props ? props?.minRows : 0
  const maxRows = 'maxRows' in props ? props?.maxRows : undefined

  const { setDocFieldPreferences } = useDocumentInfo()
  const { addFieldRow, dispatchFields, setModified } = useForm()
  const submitted = useFormSubmitted()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { localization } = useConfig()

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en'
      return locale === defaultLocale
    }

    return true
  })()

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: Props) => {
    if ('labels' in p && p?.labels) return p.labels
    if ('label' in p && p?.label) return { plural: undefined, singular: p.label }
    return { plural: t('general:rows'), singular: t('general:row') }
  }

  const labels = getLabels(props)

  const memoizedValidate = useCallback(
    (value, options) => {
      // alternative locales can be null
      if (!editingDefaultLocale && value === null) {
        return true
      }
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxRows, minRows, required })
      }
    },
    [maxRows, minRows, required, validate, editingDefaultLocale],
  )

  const {
    path,
    rows = [],
    schemaPath,
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const addRow = useCallback(
    async (rowIndex: number) => {
      await addFieldRow({ path, rowIndex, schemaPath })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [addFieldRow, path, setModified, schemaPath],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ type: 'REMOVE_ROW', path, rowIndex })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const toggleCollapseAll = useCallback(
    (collapsed: boolean) => {
      dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', collapsed, path, setDocFieldPreferences })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    (rowID: string, collapsed: boolean) => {
      dispatchFields({ type: 'SET_ROW_COLLAPSED', collapsed, path, rowID, setDocFieldPreferences })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows

  const fieldErrorCount =
    rows.reduce((total, row) => total + (row?.errorPaths?.size || 0), 0) + (valid ? 0 : 1)

  const fieldHasErrors = submitted && fieldErrorCount > 0

  const showRequired = readOnly && rows.length === 0
  const showMinRows = rows.length < minRows || (required && rows.length === 0)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
    >
      {showError && <div className={`${baseClass}__error-wrap`}>{Error}</div>}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__header-content`}>
            <h3 className={`${baseClass}__title`}>{Label}</h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} i18n={i18n} withMessage />
            )}
          </div>
          {rows.length > 0 && (
            <ul className={`${baseClass}__header-actions`}>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(true)}
                  type="button"
                >
                  {t('fields:collapseAll')}
                </button>
              </li>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(false)}
                  type="button"
                >
                  {t('fields:showAll')}
                </button>
              </li>
            </ul>
          )}
        </div>
        {Description}
      </header>
      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />
      {(rows.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__draggable-rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((row, i) => (
            <DraggableSortableItem disabled={readOnly} id={row.id} key={row.id}>
              {(draggableSortableItemProps) => (
                <ArrayRow
                  {...draggableSortableItemProps}
                  addRow={addRow}
                  duplicateRow={duplicateRow}
                  // CustomRowLabel={CustomRowLabel}
                  fieldMap={fieldMap}
                  forceRender={forceRender}
                  hasMaxRows={hasMaxRows}
                  indexPath={indexPath}
                  labels={labels}
                  moveRow={moveRow}
                  path={path}
                  permissions={permissions}
                  readOnly={readOnly}
                  removeRow={removeRow}
                  row={row}
                  rowCount={rows.length}
                  rowIndex={i}
                  setCollapse={setCollapse}
                />
              )}
            </DraggableSortableItem>
          ))}
          {!valid && (
            <React.Fragment>
              {showRequired && (
                <Banner>
                  {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
                </Banner>
              )}
              {showMinRows && (
                <Banner type="error">
                  {t('validation:requiresAtLeast', {
                    count: minRows,
                    label:
                      getTranslation(minRows ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:row' : 'general:rows'),
                  })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!readOnly && !hasMaxRows && (
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__add-row`}
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={() => addRow(value || 0)}
        >
          {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
        </Button>
      )}
    </div>
  )
}

export default ArrayFieldType
