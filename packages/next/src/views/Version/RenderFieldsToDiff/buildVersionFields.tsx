import type { I18nClient } from '@payloadcms/translations'

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

import { diffComponents } from './fields/index.js'
import { getFieldPathsModified } from './utilities/getFieldPathsModified.js'

export type BuildVersionFieldsArgs = {
  clientSchemaMap: ClientFieldSchemaMap
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
  nestingLevel?: number
  parentIndexPath: string
  parentIsLocalized: boolean
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  selectedLocales: string[]
  versionFromSiblingData: object
  versionToSiblingData: object
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
  customDiffComponents,
  entitySlug,
  fieldPermissions,
  fields,
  i18n,
  modifiedOnly,
  nestingLevel = 0,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  req,
  selectedLocales,
  versionFromSiblingData,
  versionToSiblingData,
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

    const valueFrom = fieldName ? versionFromSiblingData?.[fieldName] : versionFromSiblingData
    const valueTo = fieldName ? versionToSiblingData?.[fieldName] : versionToSiblingData

    if (isLocalized) {
      versionField.fieldByLocale = {}

      for (const locale of selectedLocales) {
        const localizedVersionField = buildVersionField({
          clientField: clientField as ClientField,
          clientSchemaMap,
          customDiffComponents,
          entitySlug,
          field,
          fieldPermissions,
          i18n,
          indexPath,
          locale,
          modifiedOnly,
          nestingLevel,
          parentIsLocalized: true,
          parentPath,
          parentSchemaPath,
          path,
          req,
          schemaPath,
          selectedLocales,
          valueFrom: valueFrom?.[locale],
          valueTo: valueTo?.[locale],
        })
        if (localizedVersionField) {
          versionField.fieldByLocale[locale] = localizedVersionField
        }
      }
    } else {
      const baseVersionField = buildVersionField({
        clientField: clientField as ClientField,
        clientSchemaMap,
        customDiffComponents,
        entitySlug,
        field,
        fieldPermissions,
        i18n,
        indexPath,
        modifiedOnly,
        nestingLevel,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath,
        parentSchemaPath,
        path,
        req,
        schemaPath,
        selectedLocales,
        valueFrom,
        valueTo,
      })

      if (baseVersionField) {
        versionField.field = baseVersionField
      }
    }

    if (
      versionField.field ||
      (versionField.fieldByLocale && Object.keys(versionField.fieldByLocale).length)
    ) {
      versionFields.push(versionField)
    }
  }

  return {
    versionFields,
  }
}

const buildVersionField = ({
  clientField,
  clientSchemaMap,
  customDiffComponents,
  entitySlug,
  field,
  fieldPermissions,
  i18n,
  indexPath,
  locale,
  modifiedOnly,
  nestingLevel,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  path,
  req,
  schemaPath,
  selectedLocales,
  valueFrom,
  valueTo,
}: {
  clientField: ClientField
  field: Field
  indexPath: string
  locale?: string
  modifiedOnly?: boolean
  nestingLevel: number
  parentIsLocalized: boolean
  path: string
  schemaPath: string
  valueFrom: unknown
  valueTo: unknown
} & Omit<
  BuildVersionFieldsArgs,
  'fields' | 'parentIndexPath' | 'versionFromSiblingData' | 'versionToSiblingData'
>): BaseVersionField | null => {
  const fieldName: null | string = 'name' in field ? field.name : null

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

  if (modifiedOnly && dequal(valueFrom, valueTo)) {
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
      const tabVersion = {
        name: 'name' in tab ? tab.name : null,
        fields: buildVersionFields({
          clientSchemaMap,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: tab.fields,
          i18n,
          modifiedOnly,
          nestingLevel: nestingLevel + 1,
          parentIndexPath: isNamedTab ? '' : tabIndexPath,
          parentIsLocalized: parentIsLocalized || tab.localized,
          parentPath: isNamedTab ? tabPath : path,
          parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
          req,
          selectedLocales,
          versionFromSiblingData: 'name' in tab ? valueFrom?.[tab.name] : valueFrom,
          versionToSiblingData: 'name' in tab ? valueTo?.[tab.name] : valueTo,
        }).versionFields,
        label: tab.label,
      }
      if (tabVersion?.fields?.length) {
        baseVersionField.tabs.push(tabVersion)
      }
    }

    if (modifiedOnly && !baseVersionField.tabs.length) {
      return null
    }
  } // At this point, we are dealing with a `row`, `collapsible`, etc
  else if ('fields' in field) {
    if (field.type === 'array' && (valueTo || valueFrom)) {
      const maxLength = Math.max(
        Array.isArray(valueTo) ? valueTo.length : 0,
        Array.isArray(valueFrom) ? valueFrom.length : 0,
      )
      baseVersionField.rows = []

      for (let i = 0; i < maxLength; i++) {
        const fromRow = (Array.isArray(valueFrom) && valueFrom?.[i]) || {}
        const toRow = (Array.isArray(valueTo) && valueTo?.[i]) || {}

        baseVersionField.rows[i] = buildVersionFields({
          clientSchemaMap,
          customDiffComponents,
          entitySlug,
          fieldPermissions,
          fields: field.fields,
          i18n,
          modifiedOnly,
          nestingLevel: nestingLevel + 1,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentIsLocalized: parentIsLocalized || field.localized,
          parentPath: path + '.' + i,
          parentSchemaPath: schemaPath,
          req,
          selectedLocales,
          versionFromSiblingData: fromRow,
          versionToSiblingData: toRow,
        }).versionFields
      }

      if (!baseVersionField.rows?.length && modifiedOnly) {
        return null
      }
    } else {
      baseVersionField.fields = buildVersionFields({
        clientSchemaMap,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields: field.fields,
        i18n,
        modifiedOnly,
        nestingLevel: field.type !== 'row' ? nestingLevel + 1 : nestingLevel,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: 'name' in field ? path : parentPath,
        parentSchemaPath: 'name' in field ? schemaPath : parentSchemaPath,
        req,
        selectedLocales,
        versionFromSiblingData: valueFrom as object,
        versionToSiblingData: valueTo as object,
      }).versionFields

      if (modifiedOnly && !baseVersionField.fields?.length) {
        return null
      }
    }
  } else if (field.type === 'blocks') {
    baseVersionField.rows = []

    const maxLength = Math.max(
      Array.isArray(valueTo) ? valueTo.length : 0,
      Array.isArray(valueFrom) ? valueFrom.length : 0,
    )

    for (let i = 0; i < maxLength; i++) {
      const fromRow = (Array.isArray(valueFrom) && valueFrom?.[i]) || {}
      const toRow = (Array.isArray(valueTo) && valueTo?.[i]) || {}

      const blockSlugToMatch: string = toRow?.blockType ?? fromRow?.blockType
      const toBlock =
        req.payload.blocks[blockSlugToMatch] ??
        ((field.blockReferences ?? field.blocks).find(
          (block) => typeof block !== 'string' && block.slug === blockSlugToMatch,
        ) as FlattenedBlock | undefined)

      let fields = []

      if (toRow.blockType === fromRow.blockType) {
        fields = toBlock.fields
      } else {
        const fromBlockSlugToMatch: string = toRow?.blockType ?? fromRow?.blockType

        const fromBlock =
          req.payload.blocks[fromBlockSlugToMatch] ??
          ((field.blockReferences ?? field.blocks).find(
            (block) => typeof block !== 'string' && block.slug === fromBlockSlugToMatch,
          ) as FlattenedBlock | undefined)

        if (fromBlock) {
          fields = getUniqueListBy<Field>([...toBlock.fields, ...fromBlock.fields], 'name')
        } else {
          fields = toBlock.fields
        }
      }

      baseVersionField.rows[i] = buildVersionFields({
        clientSchemaMap,
        customDiffComponents,
        entitySlug,
        fieldPermissions,
        fields,
        i18n,
        modifiedOnly,
        nestingLevel: nestingLevel + 1,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: path + '.' + i,
        parentSchemaPath: schemaPath + '.' + toBlock.slug,
        req,
        selectedLocales,
        versionFromSiblingData: fromRow,
        versionToSiblingData: toRow,
      }).versionFields
    }
    if (!baseVersionField.rows?.length && modifiedOnly) {
      return null
    }
  }

  const clientDiffProps: FieldDiffClientProps = {
    baseVersionField: {
      ...baseVersionField,
      CustomComponent: undefined,
    },
    /**
     * TODO: Change to valueFrom in 4.0
     */
    comparisonValue: valueFrom,
    /**
     * @deprecated remove in 4.0. Each field should handle its own diffing logic
     */
    diffMethod: 'diffWordsWithSpace',
    field: clientField,
    fieldPermissions: subFieldPermissions,
    parentIsLocalized,

    nestingLevel: nestingLevel ? nestingLevel : undefined,
    /**
     * TODO: Change to valueTo in 4.0
     */
    versionValue: valueTo,
  }
  if (locale) {
    clientDiffProps.locale = locale
  }

  const serverDiffProps: FieldDiffServerProps = {
    ...clientDiffProps,
    clientField,
    field,
    i18n,
    req,
    selectedLocales,
  }

  baseVersionField.CustomComponent = RenderServerComponent({
    clientProps: clientDiffProps,
    Component: CustomComponent,
    Fallback: DefaultComponent,
    importMap: req.payload.importMap,
    key: 'diff component',
    serverProps: serverDiffProps,
  })

  return baseVersionField
}
