import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientComponentProps,
  ClientField,
  Column,
  DefaultCellComponentProps,
  DefaultServerCellComponentProps,
  Field,
  ListPreferences,
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
  ServerComponentProps,
  StaticLabel,
} from 'payload'

import { MissingEditorProp } from 'payload'
import {
  fieldIsHiddenOrDisabled,
  fieldIsID,
  fieldIsPresentationalOnly,
  flattenTopLevelFields,
} from 'payload/shared'
import React from 'react'

import type { SortColumnProps } from '../../elements/SortColumn/index.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import {
  DefaultCell,
  RenderCustomComponent,
  RenderDefaultCell,
  SortColumn,
  // eslint-disable-next-line payload/no-imports-from-exports-dir
} from '../../exports/client/index.js'
import { hasOptionLabelJSXElement } from '../../utilities/hasOptionLabelJSXElement.js'
import { filterFields } from './filterFields.js'
import { findValueInDoc } from './findValueInDoc.js'

type Args = {
  beforeRows?: Column[]
  clientCollectionConfig: ClientCollectionConfig
  collectionConfig: SanitizedCollectionConfig
  columnPreferences: ListPreferences['columns']
  columns?: ListPreferences['columns']
  customCellProps: DefaultCellComponentProps['customCellProps']
  docs: PaginatedDocs['docs']
  enableRowSelections: boolean
  enableRowTypes?: boolean
  i18n: I18nClient
  payload: Payload
  sortColumnProps?: Partial<SortColumnProps>
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const buildColumnState = (args: Args): Column[] => {
  const {
    beforeRows,
    clientCollectionConfig,
    collectionConfig,
    columnPreferences,
    columns,
    customCellProps,
    docs,
    enableRowSelections,
    i18n,
    payload,
    sortColumnProps,
    useAsTitle,
  } = args

  // clientFields contains the fake `id` column
  let sortedFieldMap = flattenTopLevelFields(filterFields(clientCollectionConfig.fields), {
    i18n,
    keepPresentationalFields: true,
    moveSubFieldsToTop: true,
  }) as ClientField[]

  let _sortedFieldMap = flattenTopLevelFields(filterFields(collectionConfig.fields), {
    i18n,
    keepPresentationalFields: true,
    moveSubFieldsToTop: true,
  }) as Field[] // TODO: think of a way to avoid this additional flatten

  // place the `ID` field first, if it exists
  // do the same for the `useAsTitle` field with precedence over the `ID` field
  // then sort the rest of the fields based on the `defaultColumns` or `columnPreferences`
  const idFieldIndex = sortedFieldMap?.findIndex((field) => fieldIsID(field))

  if (idFieldIndex > -1) {
    const idField = sortedFieldMap.splice(idFieldIndex, 1)[0]
    sortedFieldMap.unshift(idField)
  }

  const useAsTitleFieldIndex = useAsTitle
    ? sortedFieldMap.findIndex((field) => 'name' in field && field.name === useAsTitle)
    : -1

  if (useAsTitleFieldIndex > -1) {
    const useAsTitleField = sortedFieldMap.splice(useAsTitleFieldIndex, 1)[0]
    sortedFieldMap.unshift(useAsTitleField)
  }

  const sortTo = columnPreferences || columns

  const sortFieldMap = (fieldMap, sortTo) =>
    fieldMap?.sort((a, b) => {
      const getAccessor = (field) => field.accessor ?? ('name' in field ? field.name : undefined)
      const aIndex = sortTo.findIndex((column) => 'name' in a && column.accessor === getAccessor(a))
      const bIndex = sortTo.findIndex((column) => 'name' in b && column.accessor === getAccessor(b))

      if (aIndex === -1 && bIndex === -1) {
        return 0
      }

      if (aIndex === -1) {
        return 1
      }

      if (bIndex === -1) {
        return -1
      }

      return aIndex - bIndex
    })

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    sortedFieldMap = sortFieldMap(sortedFieldMap, sortTo)
    _sortedFieldMap = sortFieldMap(_sortedFieldMap, sortTo) // TODO: think of a way to avoid this additional sort
  }

  const activeColumnsIndices = []

  const sorted: Column[] = sortedFieldMap?.reduce((acc, field, index) => {
    if (fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) {
      return acc
    }

    const accessor = (field as any).accessor ?? ('name' in field ? field.name : undefined)

    const _field = _sortedFieldMap.find((f) => {
      const fAccessor = (f as any).accessor ?? ('name' in f ? f.name : undefined)
      return fAccessor === accessor
    })

    const columnPreference = columnPreferences?.find(
      (preference) => field && 'name' in field && preference.accessor === accessor,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (columns && Array.isArray(columns) && columns.length > 0) {
      active = columns.find((column) => column.accessor === accessor)?.active
    } else if (activeColumnsIndices.length < 4) {
      active = true
    }

    if (active && !activeColumnsIndices.includes(index)) {
      activeColumnsIndices.push(index)
    }

    const CustomLabelToRender =
      _field &&
      'admin' in _field &&
      'components' in _field.admin &&
      'Label' in _field.admin.components &&
      _field.admin.components.Label !== undefined // let it return `null`
        ? _field.admin.components.Label
        : undefined

    // TODO: customComponent will be optional in v4
    const clientProps: Omit<ClientComponentProps, 'customComponents'> = {
      field,
    }

    const customLabelServerProps: Pick<
      ServerComponentProps,
      'clientField' | 'collectionSlug' | 'field' | 'i18n' | 'payload'
    > = {
      clientField: field,
      collectionSlug: collectionConfig.slug,
      field: _field,
      i18n,
      payload,
    }

    const CustomLabel = CustomLabelToRender
      ? RenderServerComponent({
          clientProps,
          Component: CustomLabelToRender,
          importMap: payload.importMap,
          serverProps: customLabelServerProps,
        })
      : undefined

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const label =
      field && 'labelWithPrefix' in field && field.labelWithPrefix !== undefined
        ? field.labelWithPrefix
        : 'label' in field
          ? field.label
          : undefined

    // Convert accessor to dot notation specifically for SortColumn sorting behavior
    const dotAccessor = accessor?.replace(/-/g, '.')

    const Heading = (
      <SortColumn
        disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
        Label={CustomLabel}
        label={label as StaticLabel}
        name={dotAccessor}
        {...(sortColumnProps || {})}
      />
    )

    const baseCellClientProps: DefaultCellComponentProps = {
      cellData: undefined,
      collectionSlug: clientCollectionConfig.slug,
      customCellProps,
      field,
      rowData: undefined,
    }

    const column: Column = {
      accessor,
      active,
      CustomLabel,
      field,
      Heading,
      renderedCells: active
        ? docs.map((doc, i) => {
            const isLinkedColumn = index === activeColumnsIndices[0]

            const cellClientProps: DefaultCellComponentProps = {
              ...baseCellClientProps,
              cellData: 'name' in field ? findValueInDoc(doc, field.name) : undefined,
              link: isLinkedColumn,
              rowData: doc,
            }

            const cellServerProps: DefaultServerCellComponentProps = {
              cellData: cellClientProps.cellData,
              className: baseCellClientProps.className,
              collectionConfig,
              collectionSlug: collectionConfig.slug,
              columnIndex: baseCellClientProps.columnIndex,
              customCellProps: baseCellClientProps.customCellProps,
              field: _field,
              i18n,
              link: cellClientProps.link,
              onClick: baseCellClientProps.onClick,
              payload,
              rowData: doc,
            }

            let CustomCell = null

            if (_field?.type === 'richText') {
              if (!_field?.editor) {
                throw new MissingEditorProp(_field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
              }

              if (typeof _field?.editor === 'function') {
                throw new Error('Attempted to access unsanitized rich text editor.')
              }

              if (!_field.admin) {
                _field.admin = {}
              }

              if (!_field.admin.components) {
                _field.admin.components = {}
              }

              CustomCell = RenderServerComponent({
                clientProps: cellClientProps,
                Component: _field.editor.CellComponent,
                importMap: payload.importMap,
                serverProps: cellServerProps,
              })
            } else if (
              cellClientProps.cellData &&
              cellClientProps.field &&
              hasOptionLabelJSXElement(cellClientProps)
            ) {
              CustomCell = RenderServerComponent({
                clientProps: cellClientProps,
                Component: DefaultCell,
                importMap: payload.importMap,
              })
            } else {
              const CustomCellComponent = _field?.admin?.components?.Cell

              if (CustomCellComponent) {
                CustomCell = RenderServerComponent({
                  clientProps: cellClientProps,
                  Component: CustomCellComponent,
                  importMap: payload.importMap,
                  serverProps: cellServerProps,
                })
              } else {
                CustomCell = undefined
              }
            }

            return (
              <RenderCustomComponent
                CustomComponent={CustomCell}
                Fallback={
                  <RenderDefaultCell
                    clientProps={cellClientProps}
                    columnIndex={index}
                    enableRowSelections={enableRowSelections}
                    isLinkedColumn={isLinkedColumn}
                  />
                }
                key={`${i}-${index}`}
              />
            )
          })
        : [],
    }

    acc.push(column)

    return acc
  }, [])

  if (beforeRows) {
    sorted.unshift(...beforeRows)
  }

  return sorted
}
