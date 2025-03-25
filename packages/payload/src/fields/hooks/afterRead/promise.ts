// @ts-strict-ignore
import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type {
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectMode,
  SelectType,
} from '../../../types/index.js'
import type { Block, Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { getBlockSelect } from '../../../utilities/getBlockSelect.js'
import { stripUnselectedFields } from '../../../utilities/stripUnselectedFields.js'
import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../../config/types.js'
import { getDefaultValue } from '../../getDefaultValue.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
import { relationshipPopulationPromise } from './relationshipPopulationPromise.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  currentDepth: number
  depth: number
  doc: JsonObject
  draft: boolean
  fallbackLocale: null | string
  field: Field | TabAsField
  fieldIndex: number
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  findMany: boolean
  flattenLocales: boolean
  global: null | SanitizedGlobalConfig
  locale: null | string
  overrideAccess: boolean
  parentIndexPath: string
  /**
   * @todo make required in v4.0
   */
  parentIsLocalized?: boolean
  parentPath: string
  parentSchemaPath: string
  populate?: PopulateType
  populationPromises: Promise<void>[]
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  showHiddenFields: boolean
  siblingDoc: JsonObject
  siblingFields?: (Field | TabAsField)[]
  triggerAccessControl?: boolean
  triggerHooks?: boolean
}

// This function is responsible for the following actions, in order:
// - Remove hidden fields from response
// - Flatten locales into requested locale
// - Sanitize outgoing data (point field, etc.)
// - Execute field hooks
// - Execute read access control
// - Populate relationships

export const promise = async ({
  blockData,
  collection,
  context,
  currentDepth,
  depth,
  doc,
  draft,
  fallbackLocale,
  field,
  fieldIndex,
  fieldPromises,
  findMany,
  flattenLocales,
  global,
  locale,
  overrideAccess,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  populate,
  populationPromises,
  req,
  select,
  selectMode,
  showHiddenFields,
  siblingDoc,
  siblingFields,
  triggerAccessControl = true,
  triggerHooks = true,
}: Args): Promise<void> => {
  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : []

  if (
    fieldAffectsData(field) &&
    field.hidden &&
    typeof siblingDoc[field.name] !== 'undefined' &&
    !showHiddenFields
  ) {
    delete siblingDoc[field.name]
  }

  if (path !== 'id') {
    const shouldContinue = stripUnselectedFields({
      field,
      select,
      selectMode,
      siblingDoc,
    })

    if (!shouldContinue) {
      return
    }
  }

  const shouldHoistLocalizedValue =
    flattenLocales &&
    fieldAffectsData(field) &&
    typeof siblingDoc[field.name] === 'object' &&
    siblingDoc[field.name] !== null &&
    fieldShouldBeLocalized({ field, parentIsLocalized }) &&
    locale !== 'all' &&
    req.payload.config.localization

  if (shouldHoistLocalizedValue) {
    // replace actual value with localized value before sanitizing
    // { [locale]: fields } -> fields
    const value = siblingDoc[field.name][locale]

    let hoistedValue = value

    if (fallbackLocale && fallbackLocale !== locale) {
      const fallbackValue = siblingDoc[field.name][fallbackLocale]
      const isNullOrUndefined = typeof value === 'undefined' || value === null

      if (fallbackValue) {
        switch (field.type) {
          case 'text':
          case 'textarea': {
            if (value === '' || isNullOrUndefined) {
              hoistedValue = fallbackValue
            }
            break
          }

          default: {
            if (isNullOrUndefined) {
              hoistedValue = fallbackValue
            }
            break
          }
        }
      }
    }

    siblingDoc[field.name] = hoistedValue
  }

  // Sanitize outgoing field value
  switch (field.type) {
    case 'group': {
      // Fill groups with empty objects so fields with hooks within groups can populate
      // themselves virtually as necessary
      if (typeof siblingDoc[field.name] === 'undefined') {
        siblingDoc[field.name] = {}
      }

      break
    }
    case 'point': {
      const pointDoc = siblingDoc[field.name] as Record<string, unknown>
      if (Array.isArray(pointDoc?.coordinates) && pointDoc.coordinates.length === 2) {
        siblingDoc[field.name] = pointDoc.coordinates
      } else {
        siblingDoc[field.name] = undefined
      }

      break
    }

    case 'richText': {
      if (!field?.editor) {
        throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }
      if (typeof field?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      // Rich Text fields should use afterRead hooks to do population. The previous editor.populationPromises have been renamed to editor.graphQLPopulationPromises
      break
    }

    case 'tabs': {
      field.tabs.forEach((tab) => {
        if (
          tabHasName(tab) &&
          (typeof siblingDoc[tab.name] === 'undefined' || siblingDoc[tab.name] === null)
        ) {
          siblingDoc[tab.name] = {}
        }
      })

      break
    }

    default: {
      break
    }
  }

  if (fieldAffectsData(field)) {
    // Execute hooks
    if (triggerHooks && field.hooks?.afterRead) {
      for (const hook of field.hooks.afterRead) {
        const shouldRunHookOnAllLocales =
          fieldShouldBeLocalized({ field, parentIsLocalized }) &&
          (locale === 'all' || !flattenLocales) &&
          typeof siblingDoc[field.name] === 'object'

        if (shouldRunHookOnAllLocales) {
          const localesAndValues = Object.entries(siblingDoc[field.name])
          await Promise.all(
            localesAndValues.map(async ([localeKey, value]) => {
              const hookedValue = await hook({
                blockData,
                collection,
                context,
                currentDepth,
                data: doc,
                depth,
                draft,
                field,
                findMany,
                global,
                indexPath: indexPathSegments,
                operation: 'read',
                originalDoc: doc,
                overrideAccess,
                path: pathSegments,
                req,
                schemaPath: schemaPathSegments,
                showHiddenFields,
                siblingData: siblingDoc,
                siblingFields,
                value,
              })

              if (hookedValue !== undefined) {
                siblingDoc[field.name][localeKey] = hookedValue
              }
            }),
          )
        } else {
          const hookedValue = await hook({
            blockData,
            collection,
            context,
            currentDepth,
            data: doc,
            depth,
            draft,
            field,
            findMany,
            global,
            indexPath: indexPathSegments,
            operation: 'read',
            originalDoc: doc,
            overrideAccess,
            path: pathSegments,
            req,
            schemaPath: schemaPathSegments,
            showHiddenFields,
            siblingData: siblingDoc,
            siblingFields,
            value: siblingDoc[field.name],
          })

          if (hookedValue !== undefined) {
            siblingDoc[field.name] = hookedValue
          }
        }
      }
    }

    // Execute access control
    let allowDefaultValue = true
    if (triggerAccessControl && field.access && field.access.read) {
      const result = overrideAccess
        ? true
        : await field.access.read({
            id: doc.id as number | string,
            blockData,
            data: doc,
            doc,
            req,
            siblingData: siblingDoc,
          })

      if (!result) {
        allowDefaultValue = false
        delete siblingDoc[field.name]
      }
    }

    // Set defaultValue on the field for globals being returned without being first created
    // or collection documents created prior to having a default
    if (
      allowDefaultValue &&
      typeof siblingDoc[field.name] === 'undefined' &&
      typeof field.defaultValue !== 'undefined'
    ) {
      siblingDoc[field.name] = await getDefaultValue({
        defaultValue: field.defaultValue,
        locale,
        req,
        user: req.user,
        value: siblingDoc[field.name],
      })
    }

    if (field.type === 'relationship' || field.type === 'upload' || field.type === 'join') {
      populationPromises.push(
        relationshipPopulationPromise({
          currentDepth,
          depth,
          draft,
          fallbackLocale,
          field,
          locale,
          overrideAccess,
          parentIsLocalized,
          populate,
          req,
          showHiddenFields,
          siblingDoc,
        }),
      )
    }
  }

  switch (field.type) {
    case 'array': {
      const rows = siblingDoc[field.name] as JsonObject

      let arraySelect = select?.[field.name]

      if (selectMode === 'include' && typeof arraySelect === 'object') {
        arraySelect = {
          ...arraySelect,
          id: true,
        }
      }

      if (Array.isArray(rows)) {
        rows.forEach((row, rowIndex) => {
          traverseFields({
            blockData,
            collection,
            context,
            currentDepth,
            depth,
            doc,
            draft,
            fallbackLocale,
            fieldPromises,
            fields: field.fields,
            findMany,
            flattenLocales,
            global,
            locale,
            overrideAccess,
            parentIndexPath: '',
            parentIsLocalized: parentIsLocalized || field.localized,
            parentPath: path + '.' + rowIndex,
            parentSchemaPath: schemaPath,
            populate,
            populationPromises,
            req,
            select: typeof arraySelect === 'object' ? arraySelect : undefined,
            selectMode,
            showHiddenFields,
            siblingDoc: row || {},
            triggerAccessControl,
            triggerHooks,
          })
        })
      } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
        Object.values(rows).forEach((localeRows) => {
          if (Array.isArray(localeRows)) {
            localeRows.forEach((row, rowIndex) => {
              traverseFields({
                blockData,
                collection,
                context,
                currentDepth,
                depth,
                doc,
                draft,
                fallbackLocale,
                fieldPromises,
                fields: field.fields,
                findMany,
                flattenLocales,
                global,
                locale,
                overrideAccess,
                parentIndexPath: '',
                parentIsLocalized: parentIsLocalized || field.localized,
                parentPath: path + '.' + rowIndex,
                parentSchemaPath: schemaPath,
                populate,
                populationPromises,
                req,
                showHiddenFields,
                siblingDoc: (row as JsonObject) || {},
                triggerAccessControl,
                triggerHooks,
              })
            })
          }
        })
      } else {
        siblingDoc[field.name] = []
      }
      break
    }

    case 'blocks': {
      const rows = siblingDoc[field.name]

      if (Array.isArray(rows)) {
        rows.forEach((row, rowIndex) => {
          const blockTypeToMatch = (row as JsonObject).blockType

          const block: Block | undefined =
            req.payload.blocks[blockTypeToMatch] ??
            ((field.blockReferences ?? field.blocks).find(
              (curBlock) => typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch,
            ) as Block | undefined)

          const { blockSelect, blockSelectMode } = getBlockSelect({
            block,
            select: select?.[field.name],
            selectMode,
          })

          if (block) {
            traverseFields({
              blockData: row,
              collection,
              context,
              currentDepth,
              depth,
              doc,
              draft,
              fallbackLocale,
              fieldPromises,
              fields: block.fields,
              findMany,
              flattenLocales,
              global,
              locale,
              overrideAccess,
              parentIndexPath: '',
              parentIsLocalized: parentIsLocalized || field.localized,
              parentPath: path + '.' + rowIndex,
              parentSchemaPath: schemaPath + '.' + block.slug,
              populate,
              populationPromises,
              req,
              select: typeof blockSelect === 'object' ? blockSelect : undefined,
              selectMode: blockSelectMode,
              showHiddenFields,
              siblingDoc: (row as JsonObject) || {},
              triggerAccessControl,
              triggerHooks,
            })
          }
        })
      } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
        Object.values(rows).forEach((localeRows) => {
          if (Array.isArray(localeRows)) {
            localeRows.forEach((row, rowIndex) => {
              const blockTypeToMatch = row.blockType

              const block: Block | undefined =
                req.payload.blocks[blockTypeToMatch] ??
                ((field.blockReferences ?? field.blocks).find(
                  (curBlock) => typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch,
                ) as Block | undefined)

              if (block) {
                traverseFields({
                  blockData: row,
                  collection,
                  context,
                  currentDepth,
                  depth,
                  doc,
                  draft,
                  fallbackLocale,
                  fieldPromises,
                  fields: block.fields,
                  findMany,
                  flattenLocales,
                  global,
                  locale,
                  overrideAccess,
                  parentIndexPath: '',
                  parentIsLocalized: parentIsLocalized || field.localized,
                  parentPath: path + '.' + rowIndex,
                  parentSchemaPath: schemaPath + '.' + block.slug,
                  populate,
                  populationPromises,
                  req,
                  showHiddenFields,
                  siblingDoc: (row as JsonObject) || {},
                  triggerAccessControl,
                  triggerHooks,
                })
              }
            })
          }
        })
      } else {
        siblingDoc[field.name] = []
      }

      break
    }

    case 'collapsible':
    case 'row': {
      traverseFields({
        blockData,
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentIndexPath: indexPath,
        parentIsLocalized,
        parentPath,
        parentSchemaPath: schemaPath,
        populate,
        populationPromises,
        req,
        select,
        selectMode,
        showHiddenFields,
        siblingDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'group': {
      let groupDoc = siblingDoc[field.name] as JsonObject

      if (typeof siblingDoc[field.name] !== 'object') {
        groupDoc = {}
      }

      const groupSelect = select?.[field.name]

      traverseFields({
        blockData,
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: parentIsLocalized || field.localized,
        parentPath: path,
        parentSchemaPath: schemaPath,
        populate,
        populationPromises,
        req,
        select: typeof groupSelect === 'object' ? groupSelect : undefined,
        selectMode,
        showHiddenFields,
        siblingDoc: groupDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'richText': {
      if (!field?.editor) {
        throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }

      if (typeof field?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      const editor: RichTextAdapter = field?.editor

      if (editor?.hooks?.afterRead?.length) {
        for (const hook of editor.hooks.afterRead) {
          const shouldRunHookOnAllLocales =
            fieldShouldBeLocalized({ field, parentIsLocalized }) &&
            (locale === 'all' || !flattenLocales) &&
            typeof siblingDoc[field.name] === 'object'

          if (shouldRunHookOnAllLocales) {
            const localesAndValues = Object.entries(siblingDoc[field.name])

            await Promise.all(
              localesAndValues.map(async ([locale, value]) => {
                const hookedValue = await hook({
                  collection,
                  context,
                  currentDepth,
                  data: doc,
                  depth,
                  draft,
                  fallbackLocale,
                  field,
                  fieldPromises,
                  findMany,
                  flattenLocales,
                  global,
                  indexPath: indexPathSegments,
                  locale,
                  operation: 'read',
                  originalDoc: doc,
                  overrideAccess,
                  parentIsLocalized,
                  path: pathSegments,
                  populate,
                  populationPromises,
                  req,
                  schemaPath: schemaPathSegments,
                  showHiddenFields,
                  siblingData: siblingDoc,
                  triggerAccessControl,
                  triggerHooks,
                  value,
                })

                if (hookedValue !== undefined) {
                  siblingDoc[field.name][locale] = hookedValue
                }
              }),
            )
          } else {
            const hookedValue = await hook({
              collection,
              context,
              currentDepth,
              data: doc,
              depth,
              draft,
              fallbackLocale,
              field,
              fieldPromises,
              findMany,
              flattenLocales,
              global,
              indexPath: indexPathSegments,
              locale,
              operation: 'read',
              originalDoc: doc,
              overrideAccess,
              parentIsLocalized,
              path: pathSegments,
              populate,
              populationPromises,
              req,
              schemaPath: schemaPathSegments,
              showHiddenFields,
              siblingData: siblingDoc,
              triggerAccessControl,
              triggerHooks,
              value: siblingDoc[field.name],
            })

            if (hookedValue !== undefined) {
              siblingDoc[field.name] = hookedValue
            }
          }
        }
      }
      break
    }

    case 'tab': {
      let tabDoc = siblingDoc
      let tabSelect: SelectType | undefined

      const isNamedTab = tabHasName(field)

      if (isNamedTab) {
        tabDoc = siblingDoc[field.name] as JsonObject

        if (typeof siblingDoc[field.name] !== 'object') {
          tabDoc = {}
        }

        if (typeof select?.[field.name] === 'object') {
          tabSelect = select?.[field.name] as SelectType
        }
      } else {
        tabSelect = select
      }

      traverseFields({
        blockData,
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentIndexPath: isNamedTab ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentPath: isNamedTab ? path : parentPath,
        parentSchemaPath: schemaPath,
        populate,
        populationPromises,
        req,
        select: tabSelect,
        selectMode,
        showHiddenFields,
        siblingDoc: tabDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'tabs': {
      traverseFields({
        blockData,
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPromises,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentIndexPath: indexPath,
        parentIsLocalized,
        parentPath: path,
        parentSchemaPath: schemaPath,
        populate,
        populationPromises,
        req,
        select,
        selectMode,
        showHiddenFields,
        siblingDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }
    default: {
      break
    }
  }
}
