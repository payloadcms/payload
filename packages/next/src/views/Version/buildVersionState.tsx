import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientField,
  ClientFieldSchemaMap,
  Field,
  FieldTypes,
  Payload,
  PayloadComponent,
  SanitizedFieldPermissions,
  Tab,
  TabAsField,
  TabAsFieldClient,
  TypedLocale,
} from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { fieldIsID, tabHasName } from 'payload/shared'

import type { DiffComponentProps, DiffComponentServerProps } from './RenderFieldsToDiff/types.js'

import { diffMethods } from './RenderFieldsToDiff/fields/diffMethods.js'
import { diffComponents } from './RenderFieldsToDiff/fields/index.js'

export type VersionTab = {
  fields: VersionField[]
  name?: string
} & Pick<Tab, 'label'>

export type VersionField = {
  CustomComponent?: React.ReactNode
  CustomComponentByLocale?: {
    [locale: TypedLocale]: React.ReactNode
  }
  fields: VersionField[]
  rows?: VersionField[][]
  tabs?: VersionTab[]
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
  payload: Payload
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
  payload,
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

    const CustomComponent = customDiffComponents?.[field.type]
    const DefaultComponent = diffComponents?.[field.type]

    const isRichText = field.type === 'richText'
    const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS'

    const versionField: VersionField = {
      type: field.type,
      fields: [],
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      versionField.tabs = []
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
        versionField.tabs.push({
          name: 'name' in tab ? tab.name : null,
          fields: buildVersionState({
            clientSchemaMap,
            comparisonSiblingData:
              'name' in tab ? comparisonSiblingData?.[tab.name] : comparisonSiblingData,
            customDiffComponents,
            entitySlug,
            fieldPermissions,
            fields: tab.fields,
            i18n,
            locales,
            parentIndexPath: isNamedTab ? '' : tabIndexPath,
            parentPath: tabPath,
            parentSchemaPath: tabSchemaPath,
            payload,
            versionSiblingData: 'name' in tab ? versionSiblingData?.[tab.name] : versionSiblingData,
          }).versionFields,
          label: tab.label,
        })
      }
    } // At this point, we are dealing with a `row`, etc
    else if ('fields' in field) {
      if (field.type === 'array') {
        const arraySiblingData = versionSiblingData?.[field.name]
        versionField.rows = []
        for (let i = 0; i < arraySiblingData.length; i++) {
          const comparisonRow = comparisonSiblingData?.[field.name]?.[i] || {}
          const versionRow = arraySiblingData[i] || {}
          versionField.rows[i] = buildVersionState({
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
            payload,
            versionSiblingData: versionRow,
          }).versionFields
        }
      } else {
        versionField.fields = buildVersionState({
          clientSchemaMap,
          comparisonSiblingData:
            'name' in field ? comparisonSiblingData?.[field.name] : comparisonSiblingData,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: field.fields,
          i18n,
          locales,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentPath: path,
          parentSchemaPath: schemaPath,
          payload,
          versionSiblingData:
            'name' in field ? versionSiblingData?.[field.name] : versionSiblingData,
        }).versionFields
      }
    } else if (field.type === 'blocks') {
      const blockSiblingData = versionSiblingData?.[field.name]
      versionField.rows = []

      for (let i = 0; i < blockSiblingData.length; i++) {
        const comparisonRow = comparisonSiblingData?.[field.name]?.[i] || {}
        const versionRow = blockSiblingData[i] || {}

        const block = field.blocks.find((block) => block.slug === versionRow.blockType)

        versionField.rows[i] = buildVersionState({
          clientSchemaMap,
          comparisonSiblingData: comparisonRow,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: block.fields,
          i18n,
          locales,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentPath: path + '.' + i,
          parentSchemaPath: schemaPath + '.' + block.slug,
          payload,
          versionSiblingData: versionRow,
        }).versionFields
      }
    }

    const fieldName: null | string = 'name' in field ? field.name : null

    const versionValue = fieldName ? versionSiblingData?.[fieldName] : versionSiblingData

    const comparisonValue = fieldName ? comparisonSiblingData?.[fieldName] : comparisonSiblingData

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
      continue
    }

    const clientCellProps: DiffComponentProps = {
      comparisonValue,
      diffMethod,
      field: clientField as ClientField,
      fieldPermissions: subFieldPermissions,
      fields: 'fields' in clientField ? clientField?.fields : [],
      isRichText,
      locales,
      versionField: {
        ...versionField,
        CustomComponent: undefined,
        CustomComponentByLocale: undefined,
      },
      versionValue,
    }

    const serverCellProps: DiffComponentServerProps = {
      ...clientCellProps,
      clientField: clientField as ClientField,
      field,
      i18n,
    }

    if ('localized' in field && field.localized) {
      versionField.CustomComponentByLocale = {}

      for (const locale of locales) {
        const versionLocaleValue = versionValue?.[locale]
        const comparisonLocaleValue = comparisonValue?.[locale]

        versionField.CustomComponentByLocale[locale] = RenderServerComponent({
          clientProps: {
            ...clientCellProps,
            comparisonValue: comparisonLocaleValue,
            locale,
            versionValue: versionLocaleValue,
          } as DiffComponentProps,
          Component: CustomComponent,
          Fallback: DefaultComponent,
          importMap: payload.importMap,
          key: 'diff component with locale',
          serverProps: {
            ...serverCellProps,
            comparisonValue: comparisonLocaleValue,
            locale,
            versionValue: versionLocaleValue,
          } as DiffComponentServerProps,
        })
      }
    } else {
      versionField.CustomComponent = RenderServerComponent({
        clientProps: clientCellProps,
        Component: CustomComponent,
        Fallback: DefaultComponent,
        importMap: payload.importMap,
        key: 'diff component',
        serverProps: serverCellProps,
      })
    }

    versionState.versionFields.push(versionField)
  }

  return versionState
}
