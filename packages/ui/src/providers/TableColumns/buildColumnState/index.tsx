import type { I18nClient } from '@ruya.sa/translations'
import type {
  ClientComponentProps,
  ClientField,
  CollectionPreferences,
  CollectionSlug,
  Column,
  DefaultCellComponentProps,
  Document,
  Field,
  PaginatedDocs,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
  ServerComponentProps,
  StaticLabel,
  ViewTypes,
} from '@ruya.sa/payload'

import {
  fieldIsHiddenOrDisabled,
  fieldIsID,
  fieldIsPresentationalOnly,
  flattenTopLevelFields,
} from '@ruya.sa/payload/shared'
import React from 'react'

import type { SortColumnProps } from '../../../elements/SortColumn/index.js'

import { RenderServerComponent } from '../../../elements/RenderServerComponent/index.js'
import {
  SortColumn,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- MUST reference the exports dir: https://github.com/payloadcms/payload/issues/12002#issuecomment-2791493587
} from '../../../exports/client/index.js'
import { filterFieldsWithPermissions } from './filterFieldsWithPermissions.js'
import { isColumnActive } from './isColumnActive.js'
import { renderCell } from './renderCell.js'
import { sortFieldMap } from './sortFieldMap.js'

export type BuildColumnStateArgs = {
  beforeRows?: Column[]
  clientFields: ClientField[]
  columns?: CollectionPreferences['columns']
  customCellProps: DefaultCellComponentProps['customCellProps']
  enableLinkedCell?: boolean
  enableRowSelections: boolean
  enableRowTypes?: boolean
  fieldPermissions?: SanitizedFieldsPermissions
  i18n: I18nClient
  payload: Payload
  req?: PayloadRequest
  serverFields: Field[]
  sortColumnProps?: Partial<SortColumnProps>
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
  viewType?: ViewTypes
} & (
  | {
      collectionSlug: CollectionSlug
      dataType: 'monomorphic'
      docs: PaginatedDocs['docs']
    }
  | {
      collectionSlug?: undefined
      dataType: 'polymorphic'
      docs: {
        relationTo: CollectionSlug
        value: Document
      }[]
    }
)

export const buildColumnState = (args: BuildColumnStateArgs): Column[] => {
  const {
    beforeRows,
    clientFields,
    collectionSlug,
    columns,
    customCellProps,
    dataType,
    docs,
    enableLinkedCell = true,
    enableRowSelections,
    fieldPermissions,
    i18n,
    payload,
    req,
    serverFields,
    sortColumnProps,
    useAsTitle,
    viewType,
  } = args

  // clientFields contains the fake `id` column
  let sortedFieldMap = flattenTopLevelFields(
    filterFieldsWithPermissions({ fieldPermissions, fields: clientFields }),
    {
      i18n,
      keepPresentationalFields: true,
      moveSubFieldsToTop: true,
    },
  ) as ClientField[]

  let _sortedFieldMap = flattenTopLevelFields(
    filterFieldsWithPermissions({
      fieldPermissions,
      fields: serverFields,
    }),
    {
      i18n,
      keepPresentationalFields: true,
      moveSubFieldsToTop: true,
    },
  ) as Field[] // TODO: think of a way to avoid this additional flatten

  // place the `ID` field first, if it exists
  // do the same for the `useAsTitle` field with precedence over the `ID` field
  // then sort the rest of the fields based on the `defaultColumns` or `columns`
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

  const sortTo = columns

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columns`
    sortedFieldMap = sortFieldMap<ClientField>(sortedFieldMap, sortTo)
    _sortedFieldMap = sortFieldMap<Field>(_sortedFieldMap, sortTo) // TODO: think of a way to avoid this additional sort
  }

  const activeColumnsIndices = []

  const sorted: Column[] = sortedFieldMap?.reduce((acc, clientField, colIndex) => {
    if (fieldIsHiddenOrDisabled(clientField) && !fieldIsID(clientField)) {
      return acc
    }

    const accessor =
      (clientField as any).accessor ?? ('name' in clientField ? clientField.name : undefined)

    const serverField = _sortedFieldMap.find((f) => {
      const fAccessor = (f as any).accessor ?? ('name' in f ? f.name : undefined)
      return fAccessor === accessor
    })

    const hasCustomCell =
      serverField?.admin &&
      'components' in serverField.admin &&
      serverField.admin.components &&
      'Cell' in serverField.admin.components &&
      serverField.admin.components.Cell

    if (serverField && serverField.type === 'group' && !hasCustomCell) {
      return acc // skip any group without a custom cell
    }

    const columnPref = columns?.find(
      (preference) => clientField && 'name' in clientField && preference.accessor === accessor,
    )

    const isActive = isColumnActive({
      accessor,
      activeColumnsIndices,
      column: columnPref,
      columns,
    })

    if (isActive && !activeColumnsIndices.includes(colIndex)) {
      activeColumnsIndices.push(colIndex)
    }

    let CustomLabel = undefined

    if (dataType === 'monomorphic') {
      const CustomLabelToRender =
        serverField &&
        'admin' in serverField &&
        'components' in serverField.admin &&
        'Label' in serverField.admin.components &&
        serverField.admin.components.Label !== undefined // let it return `null`
          ? serverField.admin.components.Label
          : undefined

      // TODO: customComponent will be optional in v4
      const clientProps: Omit<ClientComponentProps, 'customComponents'> = {
        field: clientField,
      }

      const customLabelServerProps: Pick<
        ServerComponentProps,
        'clientField' | 'collectionSlug' | 'field' | 'i18n' | 'payload'
      > = {
        clientField,
        collectionSlug,
        field: serverField,
        i18n,
        payload,
      }

      CustomLabel = CustomLabelToRender
        ? RenderServerComponent({
            clientProps,
            Component: CustomLabelToRender,
            importMap: payload.importMap,
            serverProps: customLabelServerProps,
          })
        : undefined
    }

    const fieldAffectsDataSubFields =
      clientField &&
      clientField.type &&
      (clientField.type === 'array' ||
        clientField.type === 'group' ||
        clientField.type === 'blocks')

    const label =
      clientField && 'labelWithPrefix' in clientField && clientField.labelWithPrefix !== undefined
        ? clientField.labelWithPrefix
        : 'label' in clientField
          ? clientField.label
          : undefined

    // Convert accessor to dot notation specifically for SortColumn sorting behavior
    const dotAccessor = accessor?.replace(/-/g, '.')

    const isVirtualField = serverField && 'virtual' in serverField && serverField.virtual === true

    const Heading = (
      <SortColumn
        disable={
          fieldAffectsDataSubFields ||
          fieldIsPresentationalOnly(clientField) ||
          isVirtualField ||
          undefined
        }
        Label={CustomLabel}
        label={label as StaticLabel}
        name={dotAccessor}
        {...(sortColumnProps || {})}
      />
    )

    const column: Column = {
      accessor,
      active: isActive,
      CustomLabel,
      field: clientField,
      Heading,
      renderedCells: isActive
        ? docs.map((doc, rowIndex) => {
            return renderCell({
              clientField,
              collectionSlug: dataType === 'monomorphic' ? collectionSlug : doc.relationTo,
              columnIndex: colIndex,
              customCellProps,
              doc: dataType === 'monomorphic' ? doc : doc.value,
              enableRowSelections,
              i18n,
              isLinkedColumn: enableLinkedCell && colIndex === activeColumnsIndices[0],
              payload,
              req,
              rowIndex,
              serverField,
              viewType,
            })
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
