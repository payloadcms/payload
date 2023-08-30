import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types.js'

import { array } from '../../../../../fields/validations.js'
import { getTranslation } from '../../../../../utilities/getTranslation.js'
import { scrollToID } from '../../../../utilities/scrollToID.js'
import Banner from '../../../elements/Banner/index.js'
import Button from '../../../elements/Button/index.js'
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import DraggableSortable from '../../../elements/DraggableSortable/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useConfig } from '../../../utilities/Config/index.js'
import { useDocumentInfo } from '../../../utilities/DocumentInfo/index.js'
import { useLocale } from '../../../utilities/Locale/index.js'
import Error from '../../Error/index.js'
import FieldDescription from '../../FieldDescription/index.js'
import { useForm, useFormSubmitted } from '../../Form/context.js'
import { NullifyLocaleField } from '../../NullifyField/index.js'
import useField from '../../useField/index.js'
import withCondition from '../../withCondition/index.js'
import { ArrayRow } from './ArrayRow.js'
import './index.scss'

const baseClass = 'array-field'

const ArrayFieldType: React.FC<Props> = (props) => {
  const {
    admin: { className, components, condition, description, readOnly },
    fieldTypes,
    fields,
    indexPath,
    localized,
    maxRows,
    minRows,
    name,
    path: pathFromProps,
    permissions,
    required,
    validate = array,
  } = props

  const path = pathFromProps || name

  // eslint-disable-next-line react/destructuring-assignment
  const label = props?.label ?? props?.labels?.singular

  const CustomRowLabel = components?.RowLabel || undefined

  const { setDocFieldPreferences } = useDocumentInfo()
  const { addFieldRow, dispatchFields, removeFieldRow, setModified } = useForm()
  const submitted = useFormSubmitted()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation('fields')
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
    if (p?.labels) return p.labels
    if (p?.label) return { plural: undefined, singular: p.label }
    return { plural: t('rows'), singular: t('row') }
  }

  const labels = getLabels(props)

  const memoizedValidate = useCallback(
    (value, options) => {
      // alternative locales can be null
      if (!editingDefaultLocale && value === null) {
        return true
      }
      return validate(value, { ...options, maxRows, minRows, required })
    },
    [maxRows, minRows, required, validate, editingDefaultLocale],
  )

  const {
    errorMessage,
    rows = [],
    showError,
    valid,
    value,
  } = useField<number>({
    condition,
    hasRows: true,
    path,
    validate: memoizedValidate,
  })

  const addRow = useCallback(
    async (rowIndex: number) => {
      await addFieldRow({ path, rowIndex })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [addFieldRow, path, setModified],
  )

  const duplicateRow = useCallback(
    async (rowIndex: number) => {
      dispatchFields({ path, rowIndex, type: 'DUPLICATE_ROW' })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      removeFieldRow({ path, rowIndex })
      setModified(true)
    },
    [removeFieldRow, path, setModified],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      dispatchFields({ moveFromIndex, moveToIndex, path, type: 'MOVE_ROW' })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const toggleCollapseAll = useCallback(
    async (collapsed: boolean) => {
      dispatchFields({ collapsed, path, setDocFieldPreferences, type: 'SET_ALL_ROWS_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    async (rowID: string, collapsed: boolean) => {
      dispatchFields({ collapsed, path, rowID, setDocFieldPreferences, type: 'SET_ROW_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows
  const fieldErrorCount =
    rows.reduce((total, row) => total + (row?.childErrorPaths?.size || 0), 0) + (valid ? 0 : 1)
  const fieldHasErrors = submitted && fieldErrorCount > 0

  const classes = [
    'field-type',
    baseClass,
    className,
    fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} id={`field-${path.replace(/\./g, '__')}`}>
      <div className={`${baseClass}__error-wrap`}>
        <Error message={errorMessage} showError={showError} />
      </div>
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__header-content`}>
            <h3>{getTranslation(label || name, i18n)}</h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} withMessage />
            )}
          </div>

          <ul className={`${baseClass}__header-actions`}>
            <li>
              <button
                className={`${baseClass}__header-action`}
                onClick={() => toggleCollapseAll(true)}
                type="button"
              >
                {t('collapseAll')}
              </button>
            </li>

            <li>
              <button
                className={`${baseClass}__header-action`}
                onClick={() => toggleCollapseAll(false)}
                type="button"
              >
                {t('showAll')}
              </button>
            </li>
          </ul>
        </div>
        <FieldDescription
          className={`field-description-${path.replace(/\./g, '__')}`}
          description={description}
          value={value}
        />
      </header>

      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />

      <DraggableSortable
        className={`${baseClass}__draggable-rows`}
        ids={rows.map((row) => row.id)}
        onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
      >
        {rows.length > 0 &&
          rows.map((row, i) => (
            <DraggableSortableItem disabled={readOnly} id={row.id} key={row.id}>
              {(draggableSortableItemProps) => (
                <ArrayRow
                  {...draggableSortableItemProps}
                  CustomRowLabel={CustomRowLabel}
                  addRow={addRow}
                  duplicateRow={duplicateRow}
                  fieldTypes={fieldTypes}
                  fields={fields}
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
            {readOnly && rows.length === 0 && (
              <Banner>
                {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
              </Banner>
            )}

            {(rows.length < minRows || (required && rows.length === 0)) && (
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

      {!readOnly && !hasMaxRows && (
        <div className={`${baseClass}__add-button-wrap`}>
          <Button
            buttonStyle="icon-label"
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => addRow(value)}
          >
            {t('addLabel', { label: getTranslation(labels.singular, i18n) })}
          </Button>
        </div>
      )}
    </div>
  )
}

export default withCondition(ArrayFieldType)
