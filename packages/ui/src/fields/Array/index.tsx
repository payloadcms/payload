'use client'
import type {
  ArrayFieldClientComponent,
  ArrayFieldClientProps,
  ArrayField as ArrayFieldType,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback, useId, useMemo } from 'react'
import { toast } from 'sonner'

import type { ClipboardPasteData } from '../../elements/ClipboardAction/types.js'

import { Banner } from '../../elements/Banner/index.js'
import { Button } from '../../elements/Button/index.js'
import { clipboardCopy, clipboardPaste } from '../../elements/ClipboardAction/clipboardUtilities.js'
import { ClipboardAction } from '../../elements/ClipboardAction/index.js'
import {
  mergeFormStateFromClipboard,
  reduceFormStateByPath,
} from '../../elements/ClipboardAction/mergeFormStateFromClipboard.js'
import { DraggableSortableItem } from '../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../elements/DraggableSortable/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm, useFormSubmitted } from '../../forms/Form/context.js'
import { extractRowsAndCollapsedIDs, toggleAllRows } from '../../forms/Form/rowHelpers.js'
import { NullifyLocaleField } from '../../forms/NullifyField/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { scrollToID } from '../../utilities/scrollToID.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { fieldBaseClass } from '../shared/index.js'
import { ArrayRow } from './ArrayRow.js'
import './index.scss'

const baseClass = 'array-field'

export const ArrayFieldComponent: ArrayFieldClientComponent = (props) => {
  const {
    field,
    field: {
      name,
      type,
      admin: { className, description, isSortable = true } = {},
      fields,
      label,
      localized,
      maxRows,
      minRows: minRowsProp,
      required,
    },
    forceRender = false,
    path: pathFromProps,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
    validate,
  } = props

  const schemaPath = schemaPathFromProps ?? name

  const minRows = minRowsProp ?? (required ? 1 : 0)

  const { setDocFieldPreferences } = useDocumentInfo()
  const {
    addFieldRow,
    dispatchFields,
    getFields,
    moveFieldRow,
    removeFieldRow,
    replaceState,
    setModified,
  } = useForm()
  const submitted = useFormSubmitted()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const {
    config: { localization },
  } = useConfig()

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale
      return locale === defaultLocale
    }

    return true
  })()

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: ArrayFieldClientProps): Partial<ArrayFieldType['labels']> => {
    if ('labels' in p && p?.labels) {
      return p.labels
    }

    if ('labels' in p.field && p.field.labels) {
      return { plural: p.field.labels?.plural, singular: p.field.labels?.singular }
    }

    if ('label' in p.field && p.field.label) {
      return { plural: undefined, singular: p.field.label }
    }

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
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    errorPaths,
    path,
    rows = [],
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const componentId = useId()
  const scrollIdPrefix = useMemo(() => `scroll-${componentId}`, [componentId])

  const addRow = useCallback(
    (rowIndex: number) => {
      addFieldRow({
        path,
        rowIndex,
        schemaPath,
      })

      setTimeout(() => {
        scrollToID(`${scrollIdPrefix}-row-${rowIndex}`)
      }, 0)
    },
    [addFieldRow, path, schemaPath, scrollIdPrefix],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex })

      setModified(true)

      setTimeout(() => {
        scrollToID(`${scrollIdPrefix}-row-${rowIndex}`)
      }, 0)
    },
    [dispatchFields, path, scrollIdPrefix, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      removeFieldRow({ path, rowIndex })
    },
    [removeFieldRow, path],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      moveFieldRow({
        moveFromIndex,
        moveToIndex,
        path,
      })
    },
    [path, moveFieldRow],
  )

  const toggleCollapseAll = useCallback(
    (collapsed: boolean) => {
      const { collapsedIDs, updatedRows } = toggleAllRows({
        collapsed,
        rows,
      })
      setDocFieldPreferences(path, { collapsed: collapsedIDs })
      dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, updatedRows })
    },
    [dispatchFields, path, rows, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    (rowID: string, collapsed: boolean) => {
      const { collapsedIDs, updatedRows } = extractRowsAndCollapsedIDs({
        collapsed,
        rowID,
        rows,
      })

      dispatchFields({ type: 'SET_ROW_COLLAPSED', path, updatedRows })
      setDocFieldPreferences(path, { collapsed: collapsedIDs })
    },
    [dispatchFields, path, rows, setDocFieldPreferences],
  )

  const copyRow = useCallback(
    (rowIndex: number) => {
      const formState = { ...getFields() }
      const clipboardResult = clipboardCopy({
        type,
        fields,
        getDataToCopy: () =>
          reduceFormStateByPath({
            formState,
            path,
            rowIndex,
          }),
        path,
        rowIndex,
        t,
      })

      if (typeof clipboardResult === 'string') {
        toast.error(clipboardResult)
      } else {
        toast.success(t('general:copied'))
      }
    },
    [fields, getFields, path, t, type],
  )

  const pasteRow = useCallback(
    (rowIndex: number) => {
      const formState = { ...getFields() }
      const pasteArgs = {
        onPaste: (dataFromClipboard: ClipboardPasteData) => {
          const newState = mergeFormStateFromClipboard({
            dataFromClipboard,
            formState,
            path,
            rowIndex,
          })
          replaceState(newState)
          setModified(true)
        },
        path,
        schemaFields: fields,
        t,
      }

      const clipboardResult = clipboardPaste(pasteArgs)

      if (typeof clipboardResult === 'string') {
        toast.error(clipboardResult)
      }
    },
    [fields, getFields, path, replaceState, setModified, t],
  )

  const pasteField = useCallback(
    (dataFromClipboard: ClipboardPasteData) => {
      const formState = { ...getFields() }
      const newState = mergeFormStateFromClipboard({
        dataFromClipboard,
        formState,
        path,
      })
      replaceState(newState)
      setModified(true)
    },
    [getFields, path, replaceState, setModified],
  )

  const getDataToCopy = useCallback(
    () =>
      reduceFormStateByPath({
        formState: { ...getFields() },
        path,
      }),
    [getFields, path],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows

  const fieldErrorCount = errorPaths.length
  const fieldHasErrors = submitted && errorPaths.length > 0

  const showRequired = (readOnly || disabled) && rows.length === 0
  const showMinRows = (rows.length && rows.length < minRows) || (required && rows.length === 0)

  const styles = useMemo(() => mergeFieldStyles(field), [field])

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
      style={styles}
    >
      {showError && (
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
      )}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__header-content`}>
            <h3 className={`${baseClass}__title`}>
              <RenderCustomComponent
                CustomComponent={Label}
                Fallback={
                  <FieldLabel
                    as="span"
                    label={label}
                    localized={localized}
                    path={path}
                    required={required}
                  />
                }
              />
            </h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} i18n={i18n} withMessage />
            )}
          </div>
          <ul className={`${baseClass}__header-actions`}>
            {rows?.length > 0 && (
              <Fragment>
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
              </Fragment>
            )}
            <li>
              <ClipboardAction
                allowCopy={rows?.length > 0}
                allowPaste={!readOnly}
                className={`${baseClass}__header-action`}
                disabled={disabled}
                fields={fields}
                getDataToCopy={getDataToCopy}
                onPaste={pasteField}
                path={path}
                type={type}
              />
            </li>
          </ul>
        </div>
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </header>
      <NullifyLocaleField
        fieldValue={value}
        localized={localized}
        path={path}
        readOnly={readOnly}
      />
      {BeforeInput}
      {(rows?.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__draggable-rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((rowData, i) => {
            const { id: rowID, isLoading } = rowData

            const rowPath = `${path}.${i}`

            const rowErrorCount = errorPaths?.filter((errorPath) =>
              errorPath.startsWith(rowPath + '.'),
            ).length

            return (
              <DraggableSortableItem
                disabled={readOnly || disabled || !isSortable}
                id={rowID}
                key={rowID}
              >
                {(draggableSortableItemProps) => (
                  <ArrayRow
                    {...draggableSortableItemProps}
                    addRow={addRow}
                    copyRow={copyRow}
                    CustomRowLabel={rows?.[i]?.customComponents?.RowLabel}
                    duplicateRow={duplicateRow}
                    errorCount={rowErrorCount}
                    fields={fields}
                    forceRender={forceRender}
                    hasMaxRows={hasMaxRows}
                    isLoading={isLoading}
                    isSortable={isSortable}
                    labels={labels}
                    moveRow={moveRow}
                    parentPath={path}
                    pasteRow={pasteRow}
                    path={rowPath}
                    permissions={permissions}
                    readOnly={readOnly || disabled}
                    removeRow={removeRow}
                    row={rowData}
                    rowCount={rows?.length}
                    rowIndex={i}
                    schemaPath={schemaPath}
                    scrollIdPrefix={scrollIdPrefix}
                    setCollapse={setCollapse}
                  />
                )}
              </DraggableSortableItem>
            )
          })}
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
                      getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:rows' : 'general:row'),
                  })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!hasMaxRows && !readOnly && (
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__add-row`}
          disabled={disabled}
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={() => {
            void addRow(value || 0)
          }}
        >
          {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
        </Button>
      )}
      {AfterInput}
    </div>
  )
}

export const ArrayField = withCondition(ArrayFieldComponent)
