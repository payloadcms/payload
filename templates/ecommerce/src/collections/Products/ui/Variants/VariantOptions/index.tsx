'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ArrayFieldClientProps,
  type ArrayField,
  type SanitizedFieldPermissions,
  type ClientField,
  type Row,
  FormState,
} from 'payload'

import { toKebabCase } from '@/utilities/toKebabCase'
import { getTranslation } from '@payloadcms/translations'
import {
  Banner,
  Button,
  DragHandleIcon,
  ErrorPill,
  FieldDescription,
  FieldError,
  FieldLabel,
  NullifyLocaleField,
  ReactSelect,
  RenderCustomComponent,
  SelectInput,
  TextInput,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useFormFields,
  useFormModified,
  useFormSubmitted,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { DraggableSortable } from '@payloadcms/ui/elements/DraggableSortable'
import { DraggableSortableItem } from '@payloadcms/ui/elements/DraggableSortable/DraggableSortableItem'
// import type { UseDraggableSortableReturn } from '@payloadcms/ui/elements/DraggableSortable/useDraggableSortable/types'
import { sortOptionsByKey } from '@/collections/Products/utilities/sortOptionsByKey'

// import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { HTMLAttributes, MouseEventHandler } from 'react'

import type { RadioGroupProps, Option, OptionKey } from '../../types'

import classes from './index.module.scss'
import { Product } from '@/payload-types'
import { Input } from '@/components/ui/input'
import { slugify } from '@/collections/Products/utilities/slugify'

const baseClass = 'variant-options'

export const VariantOptions: React.FC<ArrayFieldClientProps> = (props) => {
  const {
    field: {
      name,
      admin: { className, description, isSortable = true } = {},
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

  const schemaPath = schemaPathFromProps ?? name

  const minRows = (minRowsProp ?? required) ? 1 : 0

  const { setDocFieldPreferences } = useDocumentInfo()
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

  // const toggleCollapseAll = useCallback(
  //   (collapsed: boolean) => {
  //     const { collapsedIDs, updatedRows } = toggleAllRows({
  //       collapsed,
  //       rows: rowsData,
  //     })
  //     setDocFieldPreferences(path, { collapsed: collapsedIDs })
  //     dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, updatedRows })
  //   },
  //   [dispatchFields, path, rowsData, setDocFieldPreferences],
  // )

  // const setCollapse = useCallback(
  //   (rowID: string, collapsed: boolean) => {
  //     const { collapsedIDs, updatedRows } = extractRowsAndCollapsedIDs({
  //       collapsed,
  //       rowID,
  //       rows: rowsData,
  //     })

  //     dispatchFields({ type: 'SET_ROW_COLLAPSED', path, updatedRows })
  //     setDocFieldPreferences(path, { collapsed: collapsedIDs })
  //   },
  //   [dispatchFields, path, rowsData, setDocFieldPreferences],
  // )

  const hasMaxRows = maxRows && rowsData.length >= maxRows

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
          {/* {rowsData?.length > 0 && (
            <ul className={`${baseClass}__header-actions`}>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  // onClick={() => toggleCollapseAll(true)}
                  type="button"
                >
                  {t('fields:collapseAll')}
                </button>
              </li>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  // onClick={() => toggleCollapseAll(false)}
                  type="button"
                >
                  {t('fields:showAll')}
                </button>
              </li>
            </ul>
          )} */}
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

            const rowErrorCount = errorPaths?.filter((errorPath) =>
              errorPath.startsWith(rowPath + '.'),
            ).length

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
          {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
        </Button>
      )}
      {AfterInput}
    </div>
  )
}

type OptionItemProps = {
  readonly addRow: (rowIndex: number) => Promise<void> | void
  readonly CustomRowLabel?: React.ReactNode
  readonly duplicateRow: (rowIndex: number) => void
  readonly errorCount: number
  readonly fields: ClientField[]
  readonly forceRender?: boolean
  readonly hasMaxRows?: boolean
  readonly isLoading?: boolean
  readonly isSortable?: boolean
  readonly labels: Partial<ArrayField['labels']>
  readonly moveRow: (fromIndex: number, toIndex: number) => void
  readonly parentPath: string
  readonly path: string
  readonly permissions: SanitizedFieldPermissions
  readonly readOnly?: boolean
  readonly removeRow: (rowIndex: number) => void
  readonly row: Row
  readonly rowCount: number
  readonly rowIndex: number
  readonly schemaPath: string
  readonly setCollapse: (rowID: string, collapsed: boolean) => void
} & {
  readonly attributes: HTMLAttributes<unknown>
  readonly isDragging?: boolean
  readonly listeners: any // SyntheticListenerMap
  readonly setNodeRef: (node: HTMLElement | null) => void
  readonly transform: string
  readonly transition: string
}

const OptionItem: React.FC<OptionItemProps> = (props) => {
  const {
    addRow,
    attributes,
    CustomRowLabel,
    duplicateRow,
    errorCount,
    fields,
    forceRender = false,
    hasMaxRows,
    isDragging,
    isLoading: isLoadingFromProps,
    isSortable,
    labels,
    listeners,
    moveRow,
    parentPath,
    path,
    permissions,
    readOnly,
    removeRow,
    row,
    rowCount,
    rowIndex,
    schemaPath,
    setCollapse,
    setNodeRef,
    transform,
    transition,
  } = props

  const labelPath = `${path}.label`
  const slugPath = `${path}.slug`

  const { labelField, slugField } = useFormFields(([fields, _]) => {
    return { labelField: fields[labelPath], slugField: fields[slugPath] }
  })

  const initialLabel = labelField.value as string
  const initialSlug = slugField.value as string

  const { dispatchFields, setModified } = useForm()

  const [isEditable, setIsEditable] = useState(true)
  const [isModified, setIsModified] = useState(true)

  const [label, setLabel] = useState<string>(initialLabel)
  const [slug, setSlug] = useState<string>(initialSlug)

  useEffect(() => {
    setSlug(slugify(label))
  }, [initialLabel, label])

  const submitChange = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault()

      if (isModified) {
        dispatchFields({
          type: 'UPDATE',
          value: slug,
          path: slugPath,
        })

        dispatchFields({
          type: 'UPDATE',
          value: label,
          path: labelPath,
        })

        setModified(true)
      }
    },
    [isModified, dispatchFields, slug, slugPath, label, labelPath, setModified],
  )

  const cancelChanges = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault()

      setLabel(initialLabel)
      setSlug(initialSlug)

      setIsEditable(false)
    },
    [initialLabel, initialSlug],
  )

  return (
    <div style={{ transform, transition }}>
      <div id={row.id} ref={setNodeRef} {...attributes} {...listeners}>
        <DragHandleIcon />
      </div>

      <div /* onClick={() => setIsEditable(true)} */>
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsEditable(!isEditable)
          }}
        >
          toggle
        </button>
        {isEditable && (
          <>
            <div>
              <OptionLabel
                parentPath={path}
                setIsModified={setIsModified}
                setIsEditable={setIsEditable}
                value={label}
                setValue={setLabel}
                slug={initialSlug}
                description={`Field slug: ${slug}`}
              />
            </div>

            <button onClick={() => removeRow(rowIndex)}>removeRow</button>
            <button onClick={cancelChanges}>Cancel</button>
            <button onClick={submitChange}>Save</button>
          </>
        )}
      </div>
    </div>
  )
}

type OptionLabelProps = {
  readonly parentPath: string
  readonly setIsEditable: (value: boolean) => void
  readonly setIsModified: (value: boolean) => void
  readonly setValue: (value: string) => void
  readonly value: string
  readonly slug: string
  readonly description: string
}

const OptionLabel: React.FC<OptionLabelProps> = (props) => {
  const { parentPath, setIsEditable, setIsModified, setValue, value, slug, description } = props

  const path = `${parentPath}.label`

  return (
    <div>
      <TextInput
        onChange={(e) => {
          setValue(e.target.value)
        }}
        path={path}
        value={value}
      />
      <FieldDescription description={description} path={path} />
      Values:
      <OptionValues parentPath={parentPath} />
    </div>
  )
}

const OptionValues: React.FC<{ parentPath: string }> = ({ parentPath }) => {
  const path = `${parentPath}.options`
  const { value: valueFromForm, setValue: setValueInForm } = useField<string>({ path })
  const [options, setValueOptions] = useState<{ label: string; value: string }[]>([])

  const readOnly = false

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value?.value || option.value)
        } else {
          newValue = [selectedOption.value?.value || selectedOption.value]
        }

        setValueOptions(newValue)
      }
    },
    [readOnly, setValueOptions],
  )

  const valueToRender = useMemo(() => {
    return options.map((val, index) => {
      return {
        id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
        label: `${val}`,
        value: {
          // React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          toString: () => `${val}${index}`,
          value: val?.value || val,
        },
      }
    })
  }, [options])

  return (
    <ReactSelect
      isClearable
      isCreatable
      isMulti
      isSortable
      onChange={handleHasManyChange}
      options={[]}
      value={valueToRender}
    />
  )
}
