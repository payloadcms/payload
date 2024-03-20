import React, { Fragment, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { blocks as blocksValidator } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import { scrollToID } from '../../../../utilities/scrollToID'
import Banner from '../../../elements/Banner'
import Button from '../../../elements/Button'
import DraggableSortable from '../../../elements/DraggableSortable'
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem'
import { DrawerToggler } from '../../../elements/Drawer'
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import { useLocale } from '../../../utilities/Locale'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import { useForm, useFormSubmitted } from '../../Form/context'
import { NullifyLocaleField } from '../../NullifyField'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { BlockRow } from './BlockRow'
import { BlocksDrawer } from './BlocksDrawer'
import './index.scss'

const baseClass = 'blocks-field'

const BlocksField: React.FC<Props> = (props) => {
  const { i18n, t } = useTranslation('fields')

  const {
    name,
    admin: { className, condition, description, readOnly },
    blocks,
    fieldTypes,
    forceRender = false,
    indexPath,
    label,
    labels: labelsFromProps,
    localized,
    maxRows,
    minRows,
    path: pathFromProps,
    permissions,
    required,
    validate = blocksValidator,
  } = props

  const path = pathFromProps || name

  const { setDocFieldPreferences } = useDocumentInfo()
  const { addFieldRow, dispatchFields, removeFieldRow, setModified } = useForm()
  const { code: locale } = useLocale()
  const { localization } = useConfig()
  const drawerSlug = useDrawerSlug('blocks-drawer')
  const submitted = useFormSubmitted()

  const labels = {
    plural: t('blocks'),
    singular: t('block'),
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
    async (rowIndex: number, blockType: string) => {
      await addFieldRow({
        data: {
          blockType,
        },
        path,
        rowIndex,
      })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [addFieldRow, path, setModified],
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
      removeFieldRow({ path, rowIndex })
      setModified(true)
    },
    [path, removeFieldRow, setModified],
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

  const fieldErrorCount = rows.reduce((total, row) => total + (row?.childErrorPaths?.size || 0), 0)
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0

  const showMinRows = rows.length < minRows || (required && rows.length === 0)
  const showRequired = readOnly && rows.length === 0

  const addMore = useMemo(() => {
    if (readOnly && hasMaxRows) return null

    const hasOneBlock = blocks.length === 1
    const addMessage = t('addLabel', { label: getTranslation(labels.singular, i18n) })
    const rowIndex = rows?.length || 0

    if (hasOneBlock) {
      return (
        <Button
          buttonStyle="icon-label"
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={() => {
            addRow(rowIndex, blocks[0].slug)
          }}
        >
          {addMessage}
        </Button>
      )
    }

    return (
      <Fragment>
        <DrawerToggler className={`${baseClass}__drawer-toggler`} slug={drawerSlug}>
          <Button
            buttonStyle="icon-label"
            el="span"
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
          >
            {addMessage}
          </Button>
        </DrawerToggler>
        <BlocksDrawer
          addRow={addRow}
          addRowIndex={rowIndex}
          blocks={blocks}
          drawerSlug={drawerSlug}
          labels={labels}
        />
      </Fragment>
    )
  }, [addRow, blocks, drawerSlug, hasMaxRows, i18n, labels, readOnly, rows, t])

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
      {showError && (
        <div className={`${baseClass}__error-wrap`}>
          <Error message={errorMessage} showError={showError} />
        </div>
      )}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__heading-with-error`}>
            <h3>{getTranslation(label || name, i18n)}</h3>

            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} withMessage />
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
          )}
        </div>
        <FieldDescription description={description} path={path} value={value} />
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
                      addRow={addRow}
                      blockToRender={blockToRender}
                      blocks={blocks}
                      duplicateRow={duplicateRow}
                      fieldTypes={fieldTypes}
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
      {addMore}
    </div>
  )
}

export default withCondition(BlocksField)
