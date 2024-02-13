'use client'
import React, { Fragment, useCallback } from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import { scrollToID } from '../../../utilities/scrollToID'
import Banner from '../../../elements/Banner'
import { Button } from '../../../elements/Button'
import DraggableSortable from '../../../elements/DraggableSortable'
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem'
import { DrawerToggler } from '../../../elements/Drawer'
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useConfig } from '../../../providers/Config'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useLocale } from '../../../providers/Locale'
import { useForm, useFormSubmitted } from '../../Form/context'
import { NullifyLocaleField } from '../../NullifyField'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import { BlockRow } from './BlockRow'
import { BlocksDrawer } from './BlocksDrawer'
import LabelComp from '../../Label'

import './index.scss'

const baseClass = 'blocks-field'

const BlocksField: React.FC<Props> = (props) => {
  const { i18n, t } = useTranslation()

  const {
    name,
    className,
    readOnly,
    forceRender = false,
    indexPath,
    localized,
    Description,
    Error,
    Label: LabelFromProps,
    label,
    path: pathFromProps,
    permissions,
    required,
    validate,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const minRows = 'minRows' in props ? props.minRows : 0
  const maxRows = 'maxRows' in props ? props.maxRows : undefined
  const blocks = 'blocks' in props ? props.blocks : undefined
  const labelsFromProps = 'labels' in props ? props.labels : undefined

  const { setDocFieldPreferences } = useDocumentInfo()
  const { dispatchFields, setModified } = useForm()
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

  const {
    rows = [],
    showError,
    valid,
    value,
    path,
  } = useField<number>({
    hasRows: true,
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const addRow = useCallback(
    async (rowIndex: number, blockType: string) => {
      dispatchFields({
        blockType,
        path,
        rowIndex,
        type: 'ADD_ROW',
      })

      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [path, setModified],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
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
      dispatchFields({
        path,
        rowIndex,
        type: 'REMOVE_ROW',
      })

      setModified(true)
    },
    [path, dispatchFields, setModified],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      dispatchFields({ moveFromIndex, moveToIndex, path, type: 'MOVE_ROW' })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const toggleCollapseAll = useCallback(
    (collapsed: boolean) => {
      dispatchFields({ collapsed, path, setDocFieldPreferences, type: 'SET_ALL_ROWS_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    (rowID: string, collapsed: boolean) => {
      dispatchFields({ collapsed, path, rowID, setDocFieldPreferences, type: 'SET_ROW_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows

  const fieldErrorCount = rows.reduce((total, row) => total + (row?.errorPaths?.size || 0), 0)
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0

  const showMinRows = rows.length < minRows || (required && rows.length === 0)
  const showRequired = readOnly && rows.length === 0

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
          <div className={`${baseClass}__heading-with-error`}>
            <h3>{Label}</h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} withMessage i18n={i18n} />
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
          className={`${baseClass}__rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((row, i) => {
            const { blockType } = row
            const blockToRender = blocks.find((block) => block.slug === blockType)

            if (blockToRender) {
              return (
                <DraggableSortableItem disabled={readOnly} id={row.id} key={row.id}>
                  {(draggableSortableItemProps) => (
                    <BlockRow
                      {...draggableSortableItemProps}
                      blocks={blocks}
                      addRow={addRow}
                      block={blockToRender}
                      duplicateRow={duplicateRow}
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
                    label: getTranslation(
                      minRows === 1 || typeof minRows === 'undefined'
                        ? labels.singular
                        : labels.plural,
                      i18n,
                    ),
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
      {!readOnly && !hasMaxRows && (
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

export default BlocksField
