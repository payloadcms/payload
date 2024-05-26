/* eslint-disable no-param-reassign */
import type { RichTextAdapter } from '../../../admin/types.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type {
  PayloadRequestWithData,
  Populate,
  RequestContext,
  Select,
} from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { fieldAffectsData, tabHasName } from '../../config/types.js'
import getValueWithDefault from '../../getDefaultValue.js'
import { relationshipPopulationPromise } from './relationshipPopulationPromise.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  draft: boolean
  fallbackLocale: null | string
  field: Field | TabAsField
  fieldPath?: string
  fieldPopulatePath: string
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  findMany: boolean
  flattenLocales: boolean
  global: SanitizedGlobalConfig | null
  locale: null | string
  overrideAccess: boolean
  populateArg?: Populate
  populationPromises: Promise<void>[]
  req: PayloadRequestWithData
  select?: Select
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
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
  collection,
  context,
  currentDepth,
  depth,
  doc,
  draft,
  fallbackLocale,
  field,
  fieldPath = '',
  fieldPopulatePath,
  fieldPromises,
  findMany,
  flattenLocales,
  global,
  locale,
  overrideAccess,
  populateArg,
  populationPromises,
  req,
  select,
  showHiddenFields,
  siblingDoc,
  triggerAccessControl = true,
  triggerHooks = true,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    if (
      select &&
      !select.some((path) => {
        return `${path}.`.startsWith(`${fieldPath}${field.name}.`)
      })
    ) {
      delete siblingDoc[field.name]
      return
    }

    if (field.hidden && typeof siblingDoc[field.name] !== 'undefined' && !showHiddenFields)
      delete siblingDoc[field.name]
  }

  const shouldHoistLocalizedValue =
    flattenLocales &&
    fieldAffectsData(field) &&
    typeof siblingDoc[field.name] === 'object' &&
    siblingDoc[field.name] !== null &&
    field.localized &&
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

    case 'richText': {
      if (typeof field?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      const editor: RichTextAdapter = field?.editor
      // This is run here AND in the GraphQL Resolver
      if (editor?.populationPromises) {
        const populateDepth =
          field?.maxDepth !== undefined && field?.maxDepth < depth ? field?.maxDepth : depth

        editor.populationPromises({
          context,
          currentDepth,
          depth: populateDepth,
          draft,
          field,
          fieldPromises,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }

      break
    }

    case 'point': {
      const pointDoc = siblingDoc[field.name] as Record<string, unknown>
      if (Array.isArray(pointDoc?.coordinates) && pointDoc.coordinates.length === 2) {
        siblingDoc[field.name] = pointDoc.coordinates
      }

      break
    }

    default: {
      break
    }
  }

  if (fieldAffectsData(field)) {
    // Execute hooks
    if (triggerHooks && field.hooks?.afterRead) {
      await field.hooks.afterRead.reduce(async (priorHook, currentHook) => {
        await priorHook

        const shouldRunHookOnAllLocales =
          field.localized &&
          (locale === 'all' || !flattenLocales) &&
          typeof siblingDoc[field.name] === 'object'

        if (shouldRunHookOnAllLocales) {
          const hookPromises = Object.entries(siblingDoc[field.name]).map(([locale, value]) =>
            (async () => {
              const hookedValue = await currentHook({
                collection,
                context,
                data: doc,
                field,
                global,
                operation: 'read',
                originalDoc: doc,
                req,
                siblingData: siblingDoc,
                value,
              })

              if (hookedValue !== undefined) {
                siblingDoc[field.name][locale] = hookedValue
              }
            })(),
          )

          await Promise.all(hookPromises)
        } else {
          const hookedValue = await currentHook({
            collection,
            context,
            data: doc,
            field,
            findMany,
            global,
            operation: 'read',
            originalDoc: doc,
            overrideAccess,
            req,
            siblingData: siblingDoc,
            value: siblingDoc[field.name],
          })

          if (hookedValue !== undefined) {
            siblingDoc[field.name] = hookedValue
          }
        }
      }, Promise.resolve())
    }

    // Execute access control
    let allowDefaultValue = true
    if (triggerAccessControl && field.access && field.access.read) {
      const result = overrideAccess
        ? true
        : await field.access.read({
            id: doc.id as number | string,
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
      siblingDoc[field.name] = await getValueWithDefault({
        defaultValue: field.defaultValue,
        locale,
        user: req.user,
        value: siblingDoc[field.name],
      })
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      populationPromises.push(
        relationshipPopulationPromise({
          currentDepth,
          depth,
          draft,
          fallbackLocale,
          field,
          fieldPopulatePath: `${fieldPath}${field.name}`,
          locale,
          overrideAccess,
          populateArg,
          req,
          showHiddenFields,
          siblingDoc,
        }),
      )
    }
  }

  switch (field.type) {
    case 'group': {
      let groupDoc = siblingDoc[field.name] as Record<string, unknown>
      if (typeof siblingDoc[field.name] !== 'object') groupDoc = {}

      traverseFields({
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPath: `${fieldPath}${field.name}.`,
        fieldPopulatePath,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        populateArg,
        populationPromises,
        req,
        select,
        showHiddenFields,
        siblingDoc: groupDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'array': {
      const rows = siblingDoc[field.name]

      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          traverseFields({
            collection,
            context,
            currentDepth,
            depth,
            doc,
            draft,
            fallbackLocale,
            fieldPath: `${fieldPath}${field.name}.`,
            fieldPopulatePath: `${fieldPopulatePath}${field.name}.`,
            fieldPromises,
            fields: field.fields,
            findMany,
            flattenLocales,
            global,
            locale,
            overrideAccess,
            populateArg,
            populationPromises,
            req,
            select,
            showHiddenFields,
            siblingDoc: row || {},
            triggerAccessControl,
            triggerHooks,
          })
        })
      } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
        Object.values(rows).forEach((localeRows) => {
          if (Array.isArray(localeRows)) {
            localeRows.forEach((row) => {
              traverseFields({
                collection,
                context,
                currentDepth,
                depth,
                doc,
                draft,
                fallbackLocale,
                fieldPath: `${fieldPath}${field.name}.`,
                fieldPopulatePath: `${fieldPopulatePath}${field.name}.`,
                fieldPromises,
                fields: field.fields,
                findMany,
                flattenLocales,
                global,
                locale,
                overrideAccess,
                populateArg,
                populationPromises,
                req,
                select,
                showHiddenFields,
                siblingDoc: row || {},
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
        rows.forEach((row) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType)

          if (block) {
            traverseFields({
              collection,
              context,
              currentDepth,
              depth,
              doc,
              draft,
              fallbackLocale,
              fieldPath: `${fieldPath}${field.name}.${block.slug}.`,
              fieldPopulatePath: `${fieldPopulatePath}${field.name}.${block.slug}.`,
              fieldPromises,
              fields: block.fields,
              findMany,
              flattenLocales,
              global,
              locale,
              overrideAccess,
              populateArg,
              populationPromises,
              req,
              select,
              showHiddenFields,
              siblingDoc: row || {},
              triggerAccessControl,
              triggerHooks,
            })
          }
        })
      } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
        Object.values(rows).forEach((localeRows) => {
          if (Array.isArray(localeRows)) {
            localeRows.forEach((row) => {
              const block = field.blocks.find((blockType) => blockType.slug === row.blockType)

              if (block) {
                traverseFields({
                  collection,
                  context,
                  currentDepth,
                  depth,
                  doc,
                  draft,
                  fallbackLocale,
                  fieldPath: `${fieldPopulatePath}${field.name}.${block.slug}.`,
                  fieldPopulatePath: `${fieldPopulatePath}${field.name}.${block.slug}.`,
                  fieldPromises,
                  fields: block.fields,
                  findMany,
                  flattenLocales,
                  global,
                  locale,
                  overrideAccess,
                  populateArg,
                  populationPromises,
                  req,
                  select,
                  showHiddenFields,
                  siblingDoc: row || {},
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

    case 'row':
    case 'collapsible': {
      traverseFields({
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPath,
        fieldPopulatePath,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        populateArg,
        populationPromises,
        req,
        select,
        showHiddenFields,
        siblingDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'tab': {
      let tabDoc = siblingDoc
      let tabPopulatePath = fieldPopulatePath
      let tabSelectPath = fieldPath

      if (tabHasName(field)) {
        tabDoc = siblingDoc[field.name] as Record<string, unknown>
        tabPopulatePath = `${fieldPopulatePath}${field.name}.`
        tabSelectPath = `${fieldPath}${field.name}.`
        if (typeof siblingDoc[field.name] !== 'object') tabDoc = {}
      }

      traverseFields({
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPath: tabSelectPath,
        fieldPopulatePath: tabPopulatePath,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        populateArg,
        populationPromises,
        req,
        select,
        showHiddenFields,
        siblingDoc: tabDoc,
        triggerAccessControl,
        triggerHooks,
      })

      break
    }

    case 'tabs': {
      traverseFields({
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        fieldPath,
        fieldPopulatePath,
        fieldPromises,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        populateArg,
        populationPromises,
        req,
        select,
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
