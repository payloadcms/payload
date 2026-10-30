import ObjectIdImport from 'bson-objectid'
import {
  canAccessAdmin,
  type CollectionSlug,
  type Data,
  type Field,
  type FlattenedBlock,
  type PayloadRequest,
  type ServerFunction,
} from 'payload'
import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from 'payload/shared'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

export type CopyDataFromLocaleArgs = {
  collectionSlug?: CollectionSlug
  docID?: number | string
  fromLocale: string
  globalSlug?: string
  overrideData?: boolean
  req: PayloadRequest
  toLocale: string
}

function iterateFields(
  fields: Field[],
  fromLocaleData: Data,
  toLocaleData: Data,
  req: PayloadRequest,
  parentIsLocalized: boolean,
): void {
  fields.map((field) => {
    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array':
          // if the field has no value, take the source value
          if (
            field.name in toLocaleData &&
            // only replace if the target value is null or undefined
            [null, undefined].includes(toLocaleData[field.name]) &&
            field.name in fromLocaleData
          ) {
            toLocaleData[field.name] = fromLocaleData[field.name]
            break
          }

          // if the field has a value - loop over the data from target
          if (field.name in toLocaleData) {
            toLocaleData[field.name].map((item: Data, index: number) => {
              if (fromLocaleData[field.name]?.[index]) {
                // Generate new IDs if the field is localized to prevent errors with relational DBs.
                if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
                  toLocaleData[field.name][index].id = new ObjectId().toHexString()
                }

                iterateFields(
                  field.fields,
                  fromLocaleData[field.name][index],
                  item,
                  req,
                  parentIsLocalized || field.localized,
                )
              }
            })
          }
          break

        case 'blocks':
          // if the field has no value, take the source value
          if (
            field.name in toLocaleData &&
            // only replace if the target value is null, undefined, or empty array
            ([null, undefined].includes(toLocaleData[field.name]) ||
              (Array.isArray(toLocaleData[field.name]) && toLocaleData[field.name].length === 0)) &&
            field.name in fromLocaleData
          ) {
            toLocaleData[field.name] = fromLocaleData[field.name]
            break
          }

          // if the field has a value - loop over the data from target
          if (field.name in toLocaleData) {
            toLocaleData[field.name].map((blockData: Data, index: number) => {
              const block =
                req.payload.blocks[blockData.blockType] ??
                (field.blocks.find(
                  (block) => typeof block !== 'string' && block.slug === blockData.blockType,
                ) as FlattenedBlock | undefined)

              // Generate new IDs if the field is localized to prevent errors with relational DBs.
              if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
                toLocaleData[field.name][index].id = new ObjectId().toHexString()
              }

              if (block?.fields?.length) {
                iterateFields(
                  block?.fields,
                  fromLocaleData[field.name][index],
                  blockData,
                  req,
                  parentIsLocalized || field.localized,
                )
              }
            })
          }

          break

        case 'checkbox':
        case 'code':
        case 'date':
        case 'email':
        case 'json':
        case 'number':
        case 'point':
        case 'radio':
        case 'relationship':
        case 'richText':
        case 'select':
        case 'slug':
        case 'text':
        case 'textarea':
        case 'upload':
          if (
            field.name in toLocaleData &&
            // only replace if the target value is null or undefined
            [null, undefined].includes(toLocaleData[field.name]) &&
            field.name in fromLocaleData
          ) {
            toLocaleData[field.name] = fromLocaleData[field.name]
          }
          break

        case 'group': {
          if (
            fieldAffectsData(field) &&
            field.name in toLocaleData &&
            fromLocaleData?.[field.name] !== undefined
          ) {
            iterateFields(
              field.fields,
              fromLocaleData[field.name],
              toLocaleData[field.name],
              req,
              parentIsLocalized || field.localized,
            )
          } else {
            iterateFields(field.fields, fromLocaleData, toLocaleData, req, parentIsLocalized)
          }
          break
        }
      }
    } else {
      switch (field.type) {
        case 'collapsible':
        case 'row':
          iterateFields(field.fields, fromLocaleData, toLocaleData, req, parentIsLocalized)
          break

        case 'tabs':
          field.tabs.map((tab) => {
            if (tabHasName(tab)) {
              if (tab.name in toLocaleData && fromLocaleData?.[tab.name] !== undefined) {
                iterateFields(
                  tab.fields,
                  fromLocaleData[tab.name],
                  toLocaleData[tab.name],
                  req,
                  parentIsLocalized,
                )
              }
            } else {
              iterateFields(tab.fields, fromLocaleData, toLocaleData, req, parentIsLocalized)
            }
          })
          break
      }
    }
  })
}

function mergeData(
  fromLocaleData: Data,
  toLocaleData: Data,
  fields: Field[],
  req: PayloadRequest,
  parentIsLocalized: boolean,
): Data {
  iterateFields(fields, fromLocaleData, toLocaleData, req, parentIsLocalized)

  return toLocaleData
}

const blockFieldsOf = (
  field: Extract<Field, { type: 'blocks' }>,
  row: Data,
  req: PayloadRequest,
): Field[] | undefined => {
  const block =
    req.payload.blocks[row.blockType] ??
    field.blocks.find((item) => typeof item !== 'string' && item.slug === row.blockType)

  return typeof block === 'object' ? block.fields : undefined
}

/**
 * Drops array and block row ids that live inside a localized field.
 * `find` returns one flat locale. `traverseFields` treats a localized group as a
 * locale map and never reaches those rows, so the copied ids collide with the source
 * locale on insert. Missing ids are minted again in `beforeChange`.
 */
const stripLocalizedRowIds = (
  data: Data,
  fields: Field[],
  parentIsLocalized: boolean,
  req: PayloadRequest,
): void => {
  if (!data || typeof data !== 'object' || !Array.isArray(fields)) {
    return
  }

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabLocalized = parentIsLocalized || tab.localized === true

        if (tabHasName(tab) && data[tab.name] && typeof data[tab.name] === 'object') {
          const tabData = data[tab.name]

          if (tabData && typeof tabData === 'object' && !Array.isArray(tabData)) {
            stripLocalizedRowIds(tabData, tab.fields, tabLocalized, req)
          }
        } else {
          stripLocalizedRowIds(data, tab.fields, tabLocalized, req)
        }
      }

      continue
    }

    if ((field.type === 'row' || field.type === 'collapsible') && Array.isArray(field.fields)) {
      stripLocalizedRowIds(data, field.fields, parentIsLocalized, req)
      continue
    }

    if (!('name' in field) || !field.name || data[field.name] == null) {
      continue
    }

    const value = data[field.name]
    const localized = parentIsLocalized || field.localized === true

    if (field.type === 'group') {
      if (!value || typeof value !== 'object') {
        continue
      }

      if (!Array.isArray(value)) {
        stripLocalizedRowIds(value, field.fields, localized, req)
      }

      continue
    }

    if (field.type === 'array' || field.type === 'blocks') {
      const sets = Array.isArray(value) ? [value] : []

      for (const rows of sets) {
        if (!Array.isArray(rows)) {
          continue
        }

        for (const row of rows) {
          if (!row || typeof row !== 'object') {
            continue
          }

          if (localized) {
            delete row.id
          }

          const rowFields = field.type === 'blocks' ? blockFieldsOf(field, row, req) : field.fields

          if (Array.isArray(rowFields)) {
            stripLocalizedRowIds(row, rowFields, localized, req)
          }
        }
      }
    }
  }
}

const removeIdIfParentIsLocalized = (data: Data, fields: Field[], req: PayloadRequest): Data => {
  stripLocalizedRowIds(data, fields, false, req)

  return data
}

export const copyDataFromLocaleHandler: ServerFunction<CopyDataFromLocaleArgs> = async (args) => {
  const { req } = args

  try {
    return await copyDataFromLocale(args)
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error copying data from "${args.fromLocale}" to "${args.toLocale}"`,
    })

    // Re-throw the error so it can be caught by the client
    throw err
  }
}

export const copyDataFromLocale = async (args: CopyDataFromLocaleArgs) => {
  const {
    collectionSlug,
    docID,
    fromLocale,
    globalSlug,
    overrideData = false,
    req: {
      payload,
      payload: { collections, globals },
      user,
    },
    req,
    toLocale,
  } = args

  await canAccessAdmin({ req })

  const [fromLocaleData, toLocaleData] = await Promise.allSettled([
    globalSlug
      ? payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          draft: true,
          locale: fromLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          depth: 0,
          draft: true,
          joins: false,
          locale: fromLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        }),
    globalSlug
      ? payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          draft: true,
          locale: toLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          depth: 0,
          draft: true,
          joins: false,
          locale: toLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        }),
  ])

  if (fromLocaleData.status === 'rejected') {
    throw new Error(`Error fetching data from locale "${fromLocale}"`)
  }

  if (toLocaleData.status === 'rejected') {
    throw new Error(`Error fetching data from locale "${toLocale}"`)
  }

  const fields = globalSlug
    ? globals[globalSlug].config.fields
    : collections[collectionSlug].config.fields

  const fromLocaleDataWithoutID = fromLocaleData.value
  const toLocaleDataWithoutID = toLocaleData.value

  const dataWithID = overrideData
    ? fromLocaleDataWithoutID
    : mergeData(fromLocaleDataWithoutID, toLocaleDataWithoutID, fields, req, false)

  const data = removeIdIfParentIsLocalized(dataWithID, fields, req)

  return globalSlug
    ? await payload.updateGlobal({
        slug: globalSlug,
        data,
        draft: true,
        locale: toLocale,
        overrideAccess: false,
        req,
        user,
      })
    : await payload.update({
        id: docID,
        collection: collectionSlug,
        data,
        draft: true,
        locale: toLocale,
        overrideAccess: false,
        req,
        user,
      })
}
