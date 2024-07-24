'use client'
import type { BlockField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback } from 'react'

import type { ReducedBlock } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared/index.js'

import { Banner } from '../../elements/Banner/index.js'
import { Button } from '../../elements/Button/index.js'
import { DraggableSortableItem } from '../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../elements/DraggableSortable/index.js'
import { DrawerToggler } from '../../elements/Drawer/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useForm, useFormSubmitted } from '../../forms/Form/context.js'
import { NullifyLocaleField } from '../../forms/NullifyField/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { scrollToID } from '../../utilities/scrollToID.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { BlockRow } from './BlockRow.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'
import './index.scss'

const baseClass = 'blocks-field'

export type BlocksFieldProps = {
  blocks?: ReducedBlock[]
  forceRender?: boolean
  isSortable?: boolean
  labels?: BlockField['labels']
  maxRows?: number
  minRows?: number
  name?: string
  slug?: string
  width?: string
} & FormFieldBase

const _BlocksField: React.FC<BlocksFieldProps> = (props) => {
  const { i18n, t } = useTranslation()

  const {
    name,
    CustomDescription,
    CustomError,
    CustomLabel,
    blocks,
    className,
    descriptionProps,
    errorProps,
    forceRender = false,
    isSortable = true,
    label,
    labelProps,
    labels: labelsFromProps,
    localized,
    maxRows,
    minRows: minRowsProp,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    validate,
  } = props

  const { indexPath, readOnly: readOnlyFromContext } = useFieldProps()
  const minRows = minRowsProp ?? required ? 1 : 0

  const { setDocFieldPreferences } = useDocumentInfo()
  const { addFieldRow, dispatchFields, setModified } = useForm()
  const { code: locale } = useLocale()
  const { localization } = useConfig()
  const drawerSlug = useDrawerSlug('blocks-drawer')
  const submitted = useFormSubmitted()

  const labels = {
    plural: t('fields:blocks'),
    singular: t('fields:block'),
    ...labelsFromProps,
  }

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en'
      return locale === defaultLocale
    }

    return true
  })()

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

  const { path: pathFromContext } = useFieldProps()

  const {
    errorPaths,
    formInitializing,
    formProcessing,
    path,
    permissions,
    rows = [],
    schemaPath,
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const addRow = useCallback(
    async (rowIndex: number, blockType: string) => {
      await addFieldRow({
        data: { blockType },
        path,
        rowIndex,
        schemaPath: `${schemaPath}.${blockType}`,
      })
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
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({
        type: 'REMOVE_ROW',
        path,
        rowIndex,
      })

      setModified(true)
    },
    [path, dispatchFields, setModified],
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

  const fieldErrorCount = errorPaths.length
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0

  const showMinRows = rows.length < minRows || (required && rows.length === 0)
  const showRequired = disabled && rows.length === 0

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
      {showError && <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__heading-with-error`}>
            <h3>
              <FieldLabel
                CustomLabel={CustomLabel}
                as="span"
                label={label}
                required={required}
                unstyled
                {...(labelProps || {})}
              />
            </h3>
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
        <FieldDescription CustomDescription={CustomDescription} {...(descriptionProps || {})} />
      </header>
      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />
      {(rows.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((row, i) => {
            const { blockType } = row
            const blockToRender = blocks.find((block) => block.slug === blockType)

            if (blockToRender) {
              const rowErrorCount = errorPaths.filter((errorPath) =>
                errorPath.startsWith(`${path}.${i}`),
              ).length
              return (
                <DraggableSortableItem disabled={disabled || !isSortable} id={row.id} key={row.id}>
                  {(draggableSortableItemProps) => (
                    <BlockRow
                      {...draggableSortableItemProps}
                      addRow={addRow}
                      block={blockToRender}
                      blocks={blocks}
                      duplicateRow={duplicateRow}
                      errorCount={rowErrorCount}
                      forceRender={forceRender}
                      hasMaxRows={hasMaxRows}
                      indexPath={indexPath}
                      isSortable={isSortable}
                      labels={labels}
                      moveRow={moveRow}
                      path={path}
                      permissions={permissions}
                      readOnly={disabled}
                      removeRow={removeRow}
                      row={row}
                      rowCount={rows.length}
                      rowIndex={i}
                      schemaPath={schemaPath}
                      setCollapse={setCollapse}
                    />
                  )}
                </DraggableSortableItem>
              )
            }

            return null
          })}
          {!editingDefaultLocale && (
            <React.Fragment>
              {showMinRows && (
                <Banner type="error">
                  {t('validation:requiresAtLeast', {
                    count: minRows,
                    label:
                      getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:row' : 'general:rows'),
                  })}
                </Banner>
              )}
              {showRequired && (
                <Banner>
                  {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!disabled && !hasMaxRows && (
        <Fragment>
          <DrawerToggler className={`${baseClass}__drawer-toggler`} slug={drawerSlug}>
            <Button
              buttonStyle="icon-label"
              el="span"
              icon="plus"
              iconPosition="left"
              iconStyle="with-border"
            >
              {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
            </Button>
          </DrawerToggler>
          <BlocksDrawer
            addRow={addRow}
            addRowIndex={rows?.length || 0}
            blocks={blocks}
            drawerSlug={drawerSlug}
            labels={labels}
          />
        </Fragment>
      )}
    </div>
  )
}

export const BlocksField = withCondition(_BlocksField)
