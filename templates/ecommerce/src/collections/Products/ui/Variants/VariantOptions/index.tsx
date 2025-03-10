'use client'
import React, { useCallback } from 'react'
import { type ArrayFieldClientProps, type ArrayField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Banner,
  Button,
  ErrorPill,
  FieldDescription,
  FieldError,
  FieldLabel,
  NullifyLocaleField,
  RenderCustomComponent,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useFormSubmitted,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { DraggableSortable } from '@payloadcms/ui/elements/DraggableSortable'
import { DraggableSortableItem } from '@payloadcms/ui/elements/DraggableSortable/DraggableSortableItem'

import { OptionItem } from './OptionItem'

import { baseClass } from './shared'

import './index.scss'

export const VariantOptions: React.FC<ArrayFieldClientProps> = (props) => {
  const {
    field: {
      name,
      admin: { className, description, isSortable: isSortableFromProps = true } = {},
      fields,
      label,
      localized = false,
      maxRows,
      minRows: minRowsProp,
      required,
    },
    forceRender = false,
    path,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
    validate,
  } = props

  const isSortable = isSortableFromProps as boolean

  const schemaPath = schemaPathFromProps ?? name

  const minRows = (minRowsProp ?? required) ? 1 : 0

  const { addFieldRow, dispatchFields, setModified } = useForm()
  const submitted = useFormSubmitted()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const {
    config: { localization },
  } = useConfig()

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en'
      return locale === defaultLocale
    }

    return true
  })()

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: ArrayFieldClientProps): Partial<ArrayField['labels']> => {
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

      return true
    },
    [maxRows, minRows, required, validate, editingDefaultLocale],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label, RowLabels } = {},
    errorPaths,
    rows: rowsData = [],
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    path,
    validate: memoizedValidate,
  })

  const addRow = useCallback(
    (rowIndex: number) => {
      addFieldRow({
        path,
        rowIndex,
        schemaPath,
      })
    },
    [addFieldRow, path, schemaPath],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex })

      setModified(true)
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

  const hasMaxRows = maxRows ? rowsData.length >= maxRows : false

  const fieldErrorCount = errorPaths?.length
  const fieldHasErrors = submitted && Boolean(errorPaths?.length)

  const showRequired = readOnly && rowsData.length === 0
  const showMinRows = rowsData.length < minRows || (required && rowsData.length === 0)

  return (
    <div
      className={[
        'field-type',
        baseClass,
        className,
        fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
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
            {fieldHasErrors && fieldErrorCount && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} i18n={i18n} withMessage />
            )}
          </div>
        </div>
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </header>
      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />
      {BeforeInput}
      {(rowsData?.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__draggable-rows`}
          ids={rowsData.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rowsData.map((rowData, i) => {
            const { id: rowID, isLoading } = rowData

            const rowPath = `${path}.${i}`

            const rowErrorCount =
              errorPaths?.filter((errorPath) => errorPath.startsWith(rowPath + '.')).length || 0

            return (
              <DraggableSortableItem disabled={readOnly || !isSortable} id={rowID} key={rowID}>
                {(draggableSortableItemProps) => (
                  <OptionItem
                    {...draggableSortableItemProps}
                    addRow={addRow}
                    CustomRowLabel={RowLabels?.[i]}
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
                    path={rowPath}
                    // @ts-expect-error
                    permissions={permissions}
                    readOnly={readOnly}
                    removeRow={removeRow}
                    row={rowData}
                    rowCount={rowsData?.length}
                    rowIndex={i}
                    schemaPath={schemaPath}
                    // setCollapse={setCollapse}
                  />
                )}
              </DraggableSortableItem>
            )
          })}
          {!valid && (
            <React.Fragment>
              {showRequired && (
                <Banner>
                  {/* @ts-expect-error */}
                  {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
                </Banner>
              )}
              {showMinRows && (
                <Banner type="error">
                  {t('validation:requiresAtLeast', {
                    count: minRows,
                    label:
                      // @ts-expect-error
                      getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:rows' : 'general:row'),
                  })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!hasMaxRows && (
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__add-row`}
          disabled={readOnly}
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={() => {
            void addRow(value || 0)
          }}
        >
          {/* @ts-expect-error */}
          {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
        </Button>
      )}
      {AfterInput}
    </div>
  )
}
