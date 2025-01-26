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
import { fieldAffectsData, fieldIsID, tabHasName } from 'payload/shared'

import type { FieldDiffProps, FieldDiffPropsServer } from './RenderFieldsToDiff/types.js'

import { diffMethods } from './RenderFieldsToDiff/fields/diffMethods.js'
import { diffComponents } from './RenderFieldsToDiff/fields/index.js'

export type VersionField = {
  CustomComponent?: React.ReactNode
  CustomComponentByLocale?: {
    [locale: TypedLocale]: React.ReactNode
  }
  fields: VersionField[]
  tabs?: ({
    fields: VersionField[]
    name?: string
  } & Pick<Tab, 'label'>)[]
  type: FieldTypes
}

export type VersionState = {
  versionFields: VersionField[]
}

type Args = {
  clientSchemaMap: ClientFieldSchemaMap
  comparisonDoc
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
  version: any
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
      schemaPath: `${parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
      schemaPathWithIndex: `${parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''}${field.name}`,
    }
  }

  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  return {
    indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
    path: `${parentPath ? parentPath + (parentPath.endsWith('.') ? '' : '.') : ''}${indexSuffix}`,
    schemaPath: `${
      parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''
    }`,
    schemaPathWithIndex: `${
      parentSchemaPath ? parentSchemaPath + (parentSchemaPath.endsWith('.') ? '' : '.') : ''
    }${indexSuffix}`,
  }
}

export const buildVersionState = ({
  clientSchemaMap,
  comparisonDoc,
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
  version,
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
            comparisonDoc,
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
            version,
          }).versionFields,
          label: tab.label,
        })
      }
    }

    // At this point, we are dealing with a `row`, etc
    if ('fields' in field) {
      versionField.fields = buildVersionState({
        clientSchemaMap,
        comparisonDoc,
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
        version,
      }).versionFields
    }

    if (fieldAffectsData(field)) {
      const fieldName = field.name
      const valueIsObject = field.type === 'code' || field.type === 'json'

      const versionValue = valueIsObject
        ? JSON.stringify(version?.[fieldName])
        : version?.[fieldName]

      const comparisonValue = valueIsObject
        ? JSON.stringify(comparisonDoc?.[fieldName])
        : comparisonDoc?.[fieldName]

      const hasPermission =
        fieldPermissions === true ||
        fieldPermissions?.[fieldName] === true ||
        fieldPermissions?.[fieldName]?.read

      const subFieldPermissions =
        fieldPermissions === true ||
        fieldPermissions?.[fieldName] === true ||
        fieldPermissions?.[fieldName]?.fields

      if (!hasPermission) {
        continue
      }

      const clientCellProps: FieldDiffProps = {
        comparison: comparisonValue,
        diffMethod,
        field: clientField as ClientField,
        fieldPermissions: subFieldPermissions,
        fields: 'fields' in clientField ? clientField?.fields : [],
        isRichText,
        locales,
        version: versionValue,
        versionField,
      }

      const serverCellProps: FieldDiffPropsServer = {
        ...clientCellProps,
        clientField: clientField as ClientField,
        field,
        i18n,
      }

      if (field.localized) {
        versionField.CustomComponentByLocale = {}

        for (const locale of locales) {
          const versionLocaleValue = versionValue?.[locale]
          const comparisonLocaleValue = comparisonValue?.[locale]

          versionField.CustomComponentByLocale[locale] = RenderServerComponent({
            clientProps: {
              ...clientCellProps,
              comparison: comparisonLocaleValue,
              locale,
              version: versionLocaleValue,
            },
            Component: CustomComponent,
            Fallback: DefaultComponent,
            importMap: payload.importMap,
            key: 'diff component with locale',
            serverProps: {
              ...serverCellProps,
              comparison: comparisonLocaleValue,
              locale,
              version: versionLocaleValue,
            },
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
    }

    versionState.versionFields.push(versionField)
  }

  return versionState
}
