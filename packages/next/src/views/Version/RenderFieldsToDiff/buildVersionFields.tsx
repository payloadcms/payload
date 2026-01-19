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
  type SanitizedFieldsPermissions,
  type VersionField,
} from 'payload'
import {
  fieldIsID,
  fieldShouldBeLocalized,
  getFieldPaths,
  getUniqueListBy,
  tabHasName,
} from 'payload/shared'

import { diffComponents } from './fields/index.js'

export type BuildVersionFieldsArgs = {
  clientSchemaMap: ClientFieldSchemaMap
  customDiffComponents: Partial<
    Record<FieldTypes, PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>>
  >
  entitySlug: string
  fields: Field[]
  fieldsPermissions: SanitizedFieldsPermissions
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
  fields,
  fieldsPermissions,
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

    const { indexPath, path, schemaPath } = getFieldPaths({
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
          i18n,
          indexPath,
          locale,
          modifiedOnly,
          nestingLevel,
          parentFieldsPermissions: fieldsPermissions,
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
        i18n,
        indexPath,
        modifiedOnly,
        nestingLevel,
        parentFieldsPermissions: fieldsPermissions,
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
  i18n,
  indexPath,
  locale,
  modifiedOnly,
  nestingLevel,
  parentFieldsPermissions,
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
  parentFieldsPermissions: SanitizedFieldsPermissions
  parentIsLocalized: boolean
  path: string
  schemaPath: string
  valueFrom: unknown
  valueTo: unknown
} & Omit<
  BuildVersionFieldsArgs,
  | 'fields'
  | 'fieldsPermissions'
  | 'parentIndexPath'
  | 'versionFromSiblingData'
  | 'versionToSiblingData'
>): BaseVersionField | null => {
  let hasReadPermission: boolean = false
  let fieldPermissions: SanitizedFieldPermissions | undefined = undefined

  if (typeof parentFieldsPermissions === 'boolean') {
    hasReadPermission = parentFieldsPermissions
    fieldPermissions = parentFieldsPermissions
  } else {
    if ('name' in field) {
      fieldPermissions = parentFieldsPermissions?.[field.name]
      if (typeof fieldPermissions === 'boolean') {
        hasReadPermission = fieldPermissions
      } else if (typeof fieldPermissions?.read === 'boolean') {
        hasReadPermission = fieldPermissions.read
      }
    } else {
      // If the field is unnamed and parentFieldsPermissions is an object, its sub-fields will decide their read permissions state.
      // As far as this field is concerned, we are allowed to read it, as we need to reach its sub-fields to determine their read permissions.
      hasReadPermission = true
    }
  }

  if (!hasReadPermission) {
    // HasReadPermission is only valid if the field has a name. E.g. for a tabs field it would incorrectly return `false`.
    return null
  }

  if (modifiedOnly && dequal(valueFrom, valueTo)) {
    return null
  }

  let CustomComponent = customDiffComponents?.[field.type]
  if (field?.type === 'richText') {
    if (!field?.editor) {
      throw new MissingEditorProp({ fieldName: field.name }) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
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
      } = getFieldPaths({
        field: tabAsField,
        index: tabIndex,
        parentIndexPath: indexPath,
        parentPath: path,
        parentSchemaPath: schemaPath,
      })

      let tabFieldsPermissions: SanitizedFieldsPermissions = undefined

      // The tabs field does not have its own permissions as it's unnamed => use parentFieldsPermissions
      if (typeof parentFieldsPermissions === 'boolean') {
        tabFieldsPermissions = parentFieldsPermissions
      } else {
        if ('name' in tab) {
          const tabPermissions = parentFieldsPermissions?.[tab.name]
          if (typeof tabPermissions === 'boolean') {
            tabFieldsPermissions = tabPermissions
          } else {
            tabFieldsPermissions = tabPermissions?.fields
          }
        } else {
          tabFieldsPermissions = parentFieldsPermissions
        }
      }

      const tabVersion = {
        name: 'name' in tab ? tab.name : null,
        fields: buildVersionFields({
          clientSchemaMap,
          customDiffComponents,
          entitySlug,
          fields: tab.fields,
          fieldsPermissions: tabFieldsPermissions,
          i18n,
          modifiedOnly,
          nestingLevel: nestingLevel + 1,
          parentIndexPath: isNamedTab ? '' : tabIndexPath,
          parentIsLocalized: parentIsLocalized || tab.localized,
          parentPath: isNamedTab ? tabPath : 'name' in field ? path : parentPath,
          parentSchemaPath: tabSchemaPath,
          req,
          selectedLocales,
          versionFromSiblingData: 'name' in tab ? valueFrom?.[tab.name] : valueFrom,
          versionToSiblingData: 'name' in tab ? valueTo?.[tab.name] : valueTo,
        }).versionFields,
        label: typeof tab.label === 'function' ? tab.label({ i18n, t: i18n.t }) : tab.label,
      }
      if (tabVersion?.fields?.length) {
        baseVersionField.tabs.push(tabVersion)
      }
    }

    if (modifiedOnly && !baseVersionField.tabs.length) {
      return null
    }
  } // At this point, we are dealing with a `row`, `collapsible`, array`, etc
  else if ('fields' in field) {
    let subFieldsPermissions: SanitizedFieldsPermissions = undefined

    if ('name' in field && typeof fieldPermissions !== 'undefined') {
      // Named fields like arrays
      subFieldsPermissions =
        typeof fieldPermissions === 'boolean' ? fieldPermissions : fieldPermissions.fields
    } else {
      // Unnamed fields like collapsible and row inherit directly from parent permissions
      subFieldsPermissions = parentFieldsPermissions
    }

    if (field.type === 'array' && (valueTo || valueFrom)) {
      const maxLength = Math.max(
        Array.isArray(valueTo) ? valueTo.length : 0,
        Array.isArray(valueFrom) ? valueFrom.length : 0,
      )
      baseVersionField.rows = []

      for (let i = 0; i < maxLength; i++) {
        const fromRow = (Array.isArray(valueFrom) && valueFrom?.[i]) || {}
        const toRow = (Array.isArray(valueTo) && valueTo?.[i]) || {}

        const versionFields = buildVersionFields({
          clientSchemaMap,
          customDiffComponents,
          entitySlug,
          fields: field.fields,
          fieldsPermissions: subFieldsPermissions,
          i18n,
          modifiedOnly,
          nestingLevel: nestingLevel + 1,
          parentIndexPath: 'name' in field ? '' : indexPath,
          parentIsLocalized: parentIsLocalized || field.localized,
          parentPath: ('name' in field ? path : parentPath) + '.' + i,
          parentSchemaPath: schemaPath,
          req,
          selectedLocales,
          versionFromSiblingData: fromRow,
          versionToSiblingData: toRow,
        }).versionFields

        if (versionFields?.length) {
          baseVersionField.rows[i] = versionFields
        }
      }

      if (!baseVersionField.rows?.length && modifiedOnly) {
        return null
      }
    } else {
      baseVersionField.fields = buildVersionFields({
        clientSchemaMap,
        customDiffComponents,
        entitySlug,
        fields: field.fields,
        fieldsPermissions: subFieldsPermissions,
        i18n,
        modifiedOnly,
        nestingLevel: field.type !== 'row' ? nestingLevel + 1 : nestingLevel,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: 'name' in field ? path : parentPath,
        parentSchemaPath: schemaPath,
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

      let blockFieldsPermissions: SanitizedFieldsPermissions = undefined

      // fieldPermissions will be set here, as the blocks field has a name
      if (typeof fieldPermissions === 'boolean') {
        blockFieldsPermissions = fieldPermissions
      } else if (typeof fieldPermissions?.blocks === 'boolean') {
        blockFieldsPermissions = fieldPermissions.blocks
      } else {
        const permissionsBlockSpecific = fieldPermissions?.blocks?.[blockSlugToMatch]
        if (typeof permissionsBlockSpecific === 'boolean') {
          blockFieldsPermissions = permissionsBlockSpecific
        } else {
          blockFieldsPermissions = permissionsBlockSpecific?.fields
        }
      }

      const versionFields = buildVersionFields({
        clientSchemaMap,
        customDiffComponents,
        entitySlug,
        fields,
        fieldsPermissions: blockFieldsPermissions,
        i18n,
        modifiedOnly,
        nestingLevel: nestingLevel + 1,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
        parentPath: ('name' in field ? path : parentPath) + '.' + i,
        parentSchemaPath: schemaPath + '.' + toBlock.slug,
        req,
        selectedLocales,
        versionFromSiblingData: fromRow,
        versionToSiblingData: toRow,
      }).versionFields

      if (versionFields?.length) {
        baseVersionField.rows[i] = versionFields
      }
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
    fieldPermissions:
      typeof fieldPermissions === 'undefined' ? parentFieldsPermissions : fieldPermissions,
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
