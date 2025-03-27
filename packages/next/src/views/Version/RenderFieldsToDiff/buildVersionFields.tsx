import type { I18nClient } from '@payloadcms/translations'
import type { DiffMethod } from 'react-diff-viewer-continued'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { dequal } from 'dequal/lite'
import {
  type BaseVersionField,
  type ClientField,
  type ClientFieldSchemaMap,
  type Field,
  type FieldDiffClientProps,
  type FieldDiffServerProps,
  type FieldTypes,
  type FlattenedBlock,
  MissingEditorProp,
  type PayloadComponent,
  type PayloadRequest,
  type SanitizedFieldPermissions,
  type VersionField,
} from 'payload'
import { fieldIsID, fieldShouldBeLocalized, getUniqueListBy, tabHasName } from 'payload/shared'

import { diffMethods } from './fields/diffMethods.js'
import { diffComponents } from './fields/index.js'
import { getFieldPathsModified } from './utilities/getFieldPathsModified.js'

export type BuildVersionFieldsArgs = {
  clientSchemaMap: ClientFieldSchemaMap
  comparisonSiblingData: object
  customDiffComponents: Partial<
    Record<FieldTypes, PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>>
  >
  entitySlug: string
  fieldPermissions:
    | {
        [key: string]: SanitizedFieldPermissions
      }
    | true
  fields: Field[]
  i18n: I18nClient
  modifiedOnly: boolean
  parentIndexPath: string
  parentIsLocalized: boolean
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  selectedLocales: string[]
  versionSiblingData: object
}

/**
 * Build up an object that contains rendered diff components for each field.
 * This is then sent to the client to be rendered.
 *
 * Here, the server is responsible for traversing through the document data and building up this
 * version state object.
 */
export const buildVersionFields = ({
  clientSchemaMap,
  comparisonSiblingData,
  customDiffComponents,
  entitySlug,
  fieldPermissions,
  fields,
  i18n,
  modifiedOnly,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  req,
  selectedLocales,
  versionSiblingData,
}: BuildVersionFieldsArgs): {
  versionFields: VersionField[]
} => {
  const versionFields: VersionField[] = []
  let fieldIndex = -1

  for (const field of fields) {
    fieldIndex++

    if (fieldIsID(field)) {
      continue
    }

    const { indexPath, path, schemaPath } = getFieldPathsModified({
      field,
      index: fieldIndex,
      parentIndexPath,
      parentPath,
      parentSchemaPath,
    })

    const clientField = clientSchemaMap.get(entitySlug + '.' + schemaPath)

    if (!clientField) {
      req.payload.logger.error({
        clientFieldKey: entitySlug + '.' + schemaPath,
        clientSchemaMapKeys: Array.from(clientSchemaMap.keys()),
        msg: 'No client field found for ' + entitySlug + '.' + schemaPath,
        parentPath,
        parentSchemaPath,
        path,
        schemaPath,
      })
      throw new Error('No client field found for ' + entitySlug + '.' + schemaPath)
    }

    const versionField: VersionField = {}
    const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

    const fieldName: null | string = 'name' in field ? field.name : null

    const versionValue = fieldName ? versionSiblingData?.[fieldName] : versionSiblingData

    const comparisonValue = fieldName ? comparisonSiblingData?.[fieldName] : comparisonSiblingData

    if (isLocalized) {
      versionField.fieldByLocale = {}

      for (const locale of selectedLocales) {
        const localizedVersionField = buildVersionField({
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
          modifiedOnly,
          parentIsLocalized: true,
          parentPath,
          parentSchemaPath,
          path,
          req,
          schemaPath,
          selectedLocales,
          versionValue: versionValue?.[locale],
        })
        if (localizedVersionField) {
          versionField.fieldByLocale[locale] = localizedVersionField
        }
      }
    } else {
      const baseVersionField = buildVersionField({
        clientField: clientField as ClientField,
        clientSchemaMap,
        comparisonValue,
        customDiffComponents,
        entitySlug,
        field,
        fieldPermissions,
        i18n,
        indexPath,
        modifiedOnly,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath,
        parentSchemaPath,
        path,
        req,
        schemaPath,
        selectedLocales,
        versionValue,
      })

      if (baseVersionField) {
        versionField.field = baseVersionField
      }
    }

    versionFields.push(versionField)
  }

  return {
    versionFields,
  }
}

const buildVersionField = ({
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
  modifiedOnly,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  path,
  req,
  schemaPath,
  selectedLocales,
  versionValue,
}: {
  clientField: ClientField
  comparisonValue: unknown
  field: Field
  indexPath: string
  locale?: string
  modifiedOnly?: boolean
  parentIsLocalized: boolean
  path: string
  schemaPath: string
  versionValue: unknown
} & Omit<
  BuildVersionFieldsArgs,
  'comparisonSiblingData' | 'fields' | 'parentIndexPath' | 'versionSiblingData'
>): BaseVersionField | null => {
  const fieldName: null | string = 'name' in field ? field.name : null

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

  if (modifiedOnly && dequal(versionValue, comparisonValue)) {
    return null
  }

  let CustomComponent = customDiffComponents?.[field.type]
  if (field?.type === 'richText') {
    if (!field?.editor) {
      throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
    }

    if (typeof field?.editor === 'function') {
      throw new Error('Attempted to access unsanitized rich text editor.')
    }

    if (field.editor.CellComponent) {
      CustomComponent = field.editor.DiffComponent
    }
  }
  if (field?.admin?.components?.Diff) {
    CustomComponent = field.admin.components.Diff
  }

  const DefaultComponent = diffComponents?.[field.type]

  const baseVersionField: BaseVersionField = {
    type: field.type,
    fields: [],
    path,
    schemaPath,
  }

  if (field.type === 'tabs' && 'tabs' in field) {
    baseVersionField.tabs = []
    let tabIndex = -1
    for (const tab of field.tabs) {
      tabIndex++
      const isNamedTab = tabHasName(tab)

      const tabAsField = { ...tab, type: 'tab' }

      const {
        indexPath: tabIndexPath,
        path: tabPath,
        schemaPath: tabSchemaPath,
      } = getFieldPathsModified({
        field: tabAsField,
        index: tabIndex,
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath,
      })
      baseVersionField.tabs.push({
        name: 'name' in tab ? tab.name : null,
        fields: buildVersionFields({
          clientSchemaMap,
          comparisonSiblingData: 'name' in tab ? comparisonValue?.[tab.name] : comparisonValue,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: tab.fields,
          i18n,
          modifiedOnly,
          parentIndexPath: isNamedTab ? '' : tabIndexPath,
          parentIsLocalized: parentIsLocalized || tab.localized,
          parentPath: isNamedTab ? tabPath : path,
          parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
          req,
          selectedLocales,
          versionSiblingData: 'name' in tab ? versionValue?.[tab.name] : versionValue,
        }).versionFields,
        label: tab.label,
      })
    }
  } // At this point, we are dealing with a `row`, `collapsible`, etc
  else if ('fields' in field) {
    if (field.type === 'array' && versionValue) {
      const arrayValue = Array.isArray(versionValue) ? versionValue : []
      baseVersionField.rows = []

      for (let i = 0; i < arrayValue.length; i++) {
        const comparisonRow = comparisonValue?.[i] || {}
        const versionRow = arrayValue?.[i] || {}
        baseVersionField.rows[i] = buildVersionFields({
          clientSchemaMap,
          comparisonSiblingData: comparisonRow,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: field.fields,
          i18n,
          modifiedOnly,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentIsLocalized: parentIsLocalized || field.localized,
          parentPath: path + '.' + i,
          parentSchemaPath: schemaPath,
          req,
          selectedLocales,
          versionSiblingData: versionRow,
        }).versionFields
      }
    } else {
      baseVersionField.fields = buildVersionFields({
        clientSchemaMap,
        comparisonSiblingData: comparisonValue as object,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields: field.fields,
        i18n,
        modifiedOnly,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: 'name' in field ? path : parentPath,
        parentSchemaPath: 'name' in field ? schemaPath : parentSchemaPath,
        req,
        selectedLocales,
        versionSiblingData: versionValue as object,
      }).versionFields
    }
  } else if (field.type === 'blocks') {
    baseVersionField.rows = []

    const blocksValue = Array.isArray(versionValue) ? versionValue : []

    for (let i = 0; i < blocksValue.length; i++) {
      const comparisonRow = comparisonValue?.[i] || {}
      const versionRow = blocksValue[i] || {}

      const blockSlugToMatch: string = versionRow.blockType
      const versionBlock =
        req.payload.blocks[blockSlugToMatch] ??
        ((field.blockReferences ?? field.blocks).find(
          (block) => typeof block !== 'string' && block.slug === blockSlugToMatch,
        ) as FlattenedBlock | undefined)

      let fields = []

      if (versionRow.blockType === comparisonRow.blockType) {
        fields = versionBlock.fields
      } else {
        const comparisonBlockSlugToMatch: string = versionRow.blockType

        const comparisonBlock =
          req.payload.blocks[comparisonBlockSlugToMatch] ??
          ((field.blockReferences ?? field.blocks).find(
            (block) => typeof block !== 'string' && block.slug === comparisonBlockSlugToMatch,
          ) as FlattenedBlock | undefined)

        if (comparisonBlock) {
          fields = getUniqueListBy<Field>(
            [...versionBlock.fields, ...comparisonBlock.fields],
            'name',
          )
        } else {
          fields = versionBlock.fields
        }
      }

      baseVersionField.rows[i] = buildVersionFields({
        clientSchemaMap,
        comparisonSiblingData: comparisonRow,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields,
        i18n,
        modifiedOnly,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: path + '.' + i,
        parentSchemaPath: schemaPath + '.' + versionBlock.slug,
        req,
        selectedLocales,
        versionSiblingData: versionRow,
      }).versionFields
    }
  }

  const clientCellProps: FieldDiffClientProps = {
    baseVersionField: {
      ...baseVersionField,
      CustomComponent: undefined,
    },
    comparisonValue,
    diffMethod,
    field: clientField,
    fieldPermissions: subFieldPermissions,
    parentIsLocalized,
    versionValue,
  }

  const serverCellProps: FieldDiffServerProps = {
    ...clientCellProps,
    clientField,
    field,
    i18n,
    req,
    selectedLocales,
  }

  baseVersionField.CustomComponent = RenderServerComponent({
    clientProps: locale
      ? ({
          ...clientCellProps,
          locale,
        } as FieldDiffClientProps)
      : clientCellProps,
    Component: CustomComponent,
    Fallback: DefaultComponent,
    importMap: req.payload.importMap,
    key: 'diff component',
    serverProps: locale
      ? ({
          ...serverCellProps,
          locale,
        } as FieldDiffServerProps)
      : serverCellProps,
  })

  return baseVersionField
}
