import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientField,
  ClientFieldSchemaMap,
  Field,
  FieldTypes,
  PayloadComponent,
  PayloadRequest,
  SanitizedFieldPermissions,
  Tab,
  TabAsField,
  TabAsFieldClient,
  TypedLocale,
} from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { fieldIsID, getUniqueListBy, tabHasName } from 'payload/shared'

import type { DiffComponentProps, DiffComponentServerProps } from './RenderFieldsToDiff/types.js'

import { diffMethods } from './RenderFieldsToDiff/fields/diffMethods.js'
import { diffComponents } from './RenderFieldsToDiff/fields/index.js'

export type VersionTab = {
  fields: VersionField[]
  name?: string
} & Pick<Tab, 'label'>

export type BaseVersionField = {
  CustomComponent?: React.ReactNode
  fields: VersionField[]
  rows?: VersionField[][]
  tabs?: VersionTab[]
}

export type VersionField = {
  field?: BaseVersionField
  fieldByLocale?: Record<TypedLocale, BaseVersionField>
  type: FieldTypes
}

export type VersionState = {
  versionFields: VersionField[]
}

type Args = {
  clientSchemaMap: ClientFieldSchemaMap
  comparisonSiblingData: object
  customDiffComponents: Record<FieldTypes, PayloadComponent<null, null>>
  entitySlug: string
  fieldPermissions:
    | {
        [key: string]: SanitizedFieldPermissions
      }
    | true
  fields: Field[]
  i18n: I18nClient
  locales: string[]
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  versionSiblingData: object
}

type Args2 = {
  field: ClientField | Field | TabAsField | TabAsFieldClient
  index: number
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
}

type Result = {
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   * It will always be complete and accurate.
   */
  indexPath: string
  /**
   * Path for this field specifically.
   */
  path: string
  pathWithIndex: string
  /**
   * Schema path for this field specifically.
   */
  schemaPath: string
  schemaPathWithIndex: string
}

export function getFieldPaths2({
  field,
  index,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
}: Args2): Result {
  if ('name' in field) {
    return {
      indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
      path: `${parentPath ? parentPath + (parentPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
      pathWithIndex: `${parentPath ? parentPath + (parentPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
      schemaPath: `${parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
      schemaPathWithIndex: `${parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
    }
  }

  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  return {
    indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
    path: `${parentPath ? parentPath + (parentPath.endsWith('.') ? '' : '.') : ''}`,
    pathWithIndex: `${parentPath ? parentPath + (parentPath.endsWith('.') ? '' : '.') : ''}${indexSuffix}`,

    schemaPath: `${
      parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''
    }`,
    schemaPathWithIndex: `${
      parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''
    }${indexSuffix}`,
  }
}

/**
 * Build up an object that contains rendered diff components for each field.
 * This is then sent to the client to be rendered.
 *
 * Here, the server is responsible for traversing through the document data and building up this
 * version state object.
 */
export const buildVersionState = ({
  clientSchemaMap,
  comparisonSiblingData,
  customDiffComponents,
  entitySlug,
  fieldPermissions,
  fields,
  i18n,
  locales,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  req,
  versionSiblingData,
}: Args): VersionState => {
  const versionState: VersionState = {
    versionFields: [],
  }
  let fieldIndex = -1
  for (const field of fields) {
    fieldIndex++
    if (fieldIsID(field)) {
      continue
    }

    const { indexPath, path, schemaPath, schemaPathWithIndex } = getFieldPaths2({
      field,
      index: fieldIndex,
      parentIndexPath: 'name' in field ? '' : parentIndexPath,
      parentPath,
      parentSchemaPath,
    })

    const clientField = clientSchemaMap.get(entitySlug + '.' + schemaPathWithIndex)

    const versionField: VersionField = {
      type: field.type,
    }
    const isLocalized = 'localized' in field && field.localized
    const fieldName: null | string = 'name' in field ? field.name : null

    const versionValue = fieldName ? versionSiblingData?.[fieldName] : versionSiblingData

    const comparisonValue = fieldName ? comparisonSiblingData?.[fieldName] : comparisonSiblingData

    if (isLocalized) {
      versionField.fieldByLocale = {}

      for (const locale of locales) {
        versionField.fieldByLocale[locale] = buildVersionFieldState({
          clientField: clientField as ClientField,
          clientSchemaMap,
          comparisonValue: comparisonValue?.[locale],
          customDiffComponents,
          entitySlug,
          field,
          fieldPermissions,
          i18n,
          indexPath,
          locale,
          locales,
          parentPath,
          parentSchemaPath,
          path,
          req,
          schemaPath,
          versionValue: versionValue?.[locale],
        })
      }
    } else {
      versionField.field = buildVersionFieldState({
        clientField: clientField as ClientField,
        clientSchemaMap,
        comparisonValue,
        customDiffComponents,
        entitySlug,
        field,
        fieldPermissions,
        i18n,
        indexPath,
        locales,
        parentPath,
        parentSchemaPath,
        path,
        req,
        schemaPath,
        versionValue,
      })
    }

    versionState.versionFields.push(versionField)
  }

  return versionState
}

const buildVersionFieldState = ({
  clientField,
  clientSchemaMap,
  comparisonValue,
  customDiffComponents,
  entitySlug,
  field,
  fieldPermissions,
  i18n,
  indexPath,
  locale,
  locales,
  parentPath,
  parentSchemaPath,
  path,
  req,
  schemaPath,
  versionValue,
}: {
  clientField: ClientField
  comparisonValue: unknown
  field: Field
  indexPath: string
  locale?: string
  path: string
  schemaPath: string
  versionValue: unknown
} & Omit<
  Args,
  'comparisonSiblingData' | 'fields' | 'parentIndexPath' | 'versionSiblingData'
>): BaseVersionField | null => {
  const fieldName: null | string = 'name' in field ? field.name : null

  const isRichText = field.type === 'richText'
  const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS'

  const hasPermission =
    fieldPermissions === true ||
    !fieldName ||
    fieldPermissions?.[fieldName] === true ||
    fieldPermissions?.[fieldName]?.read

  const subFieldPermissions =
    fieldPermissions === true ||
    !fieldName ||
    fieldPermissions?.[fieldName] === true ||
    fieldPermissions?.[fieldName]?.fields

  if (!hasPermission) {
    return null
  }

  const CustomComponent = customDiffComponents?.[field.type]
  const DefaultComponent = diffComponents?.[field.type]

  const baseVersionField: BaseVersionField = {
    fields: [],
  }

  if (field.type === 'tabs' && 'tabs' in field) {
    baseVersionField.tabs = []
    let tabIndex = -1
    for (const tab of field.tabs) {
      tabIndex++
      const isNamedTab = tabHasName(tab)

      const {
        indexPath: tabIndexPath,
        path: tabPath,
        schemaPath: tabSchemaPath,
      } = getFieldPaths2({
        field: {
          ...tab,
          type: 'tab',
        },
        index: tabIndex,
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath,
      })
      baseVersionField.tabs.push({
        name: 'name' in tab ? tab.name : null,
        fields: buildVersionState({
          clientSchemaMap,
          comparisonSiblingData: 'name' in tab ? comparisonValue?.[tab.name] : comparisonValue,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: tab.fields,
          i18n,
          locales,
          parentIndexPath: isNamedTab ? '' : tabIndexPath,
          parentPath: tabPath,
          parentSchemaPath: tabSchemaPath,
          req,
          versionSiblingData: 'name' in tab ? versionValue?.[tab.name] : versionValue,
        }).versionFields,
        label: tab.label,
      })
    }
  } // At this point, we are dealing with a `row`, etc
  else if ('fields' in field) {
    if (field.type === 'array') {
      if (!Array.isArray(versionValue)) {
        throw new Error('Expected versionValue to be an array')
      }
      baseVersionField.rows = []

      for (let i = 0; i < versionValue.length; i++) {
        const comparisonRow = comparisonValue?.[i] || {}
        const versionRow = versionValue?.[i] || {}
        baseVersionField.rows[i] = buildVersionState({
          clientSchemaMap,
          comparisonSiblingData: comparisonRow,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: field.fields,
          i18n,
          locales,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentPath: path + '.' + i,
          parentSchemaPath: schemaPath,
          req,
          versionSiblingData: versionRow,
        }).versionFields
      }
    } else {
      baseVersionField.fields = buildVersionState({
        clientSchemaMap,
        comparisonSiblingData: comparisonValue as object,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields: field.fields,
        i18n,
        locales,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        versionSiblingData: versionValue as object,
      }).versionFields
    }
  } else if (field.type === 'blocks') {
    baseVersionField.rows = []

    if (!Array.isArray(versionValue)) {
      throw new Error('Expected versionValue to be an array')
    }

    for (let i = 0; i < versionValue.length; i++) {
      const comparisonRow = comparisonValue?.[i] || {}
      const versionRow = versionValue[i] || {}
      const versionBlock = field.blocks.find((block) => block.slug === versionRow.blockType)

      let fields = []

      if (versionRow.blockType === comparisonRow.blockType) {
        fields = versionBlock.fields
      } else {
        const comparisonBlock = field.blocks.find((block) => block.slug === comparisonRow.blockType)

        fields = getUniqueListBy<Field>([...versionBlock.fields, ...comparisonBlock.fields], 'name')
      }

      baseVersionField.rows[i] = buildVersionState({
        clientSchemaMap,
        comparisonSiblingData: comparisonRow,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields,
        i18n,
        locales,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentPath: path + '.' + i,
        parentSchemaPath: schemaPath + '.' + versionBlock.slug,
        req,
        versionSiblingData: versionRow,
      }).versionFields
    }
  }

  const clientCellProps: DiffComponentProps = {
    baseVersionField: {
      ...baseVersionField,
      CustomComponent: undefined,
    },
    comparisonValue,
    diffMethod,
    field: clientField,
    fieldPermissions: subFieldPermissions,
    fields: 'fields' in clientField ? clientField?.fields : [],
    isRichText,
    locales,
    versionValue,
  }

  const serverCellProps: DiffComponentServerProps = {
    ...clientCellProps,
    clientField,
    field,
    i18n,
    req,
  }

  baseVersionField.CustomComponent = RenderServerComponent({
    clientProps: locale
      ? ({
          ...clientCellProps,
          locale,
        } as DiffComponentProps)
      : clientCellProps,
    Component: CustomComponent,
    Fallback: DefaultComponent,
    importMap: req.payload.importMap,
    key: 'diff component',
    serverProps: locale
      ? ({
          ...serverCellProps,
          locale,
        } as DiffComponentServerProps)
      : serverCellProps,
  })

  return baseVersionField
}
