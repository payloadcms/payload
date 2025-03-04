import ObjectIdImport from 'bson-objectid'
import {
  type CollectionSlug,
  type Data,
  type Field,
  type FlattenedBlock,
  formatErrors,
  type PayloadRequest,
} from 'payload'
import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from 'payload/shared'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

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
            // only replace if the target value is null or undefined
            [null, undefined].includes(toLocaleData[field.name]) &&
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
                ((field.blockReferences ?? field.blocks).find(
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
          if (field.name in toLocaleData && fromLocaleData?.[field.name] !== undefined) {
            iterateFields(
              field.fields,
              fromLocaleData[field.name],
              toLocaleData[field.name],
              req,
              parentIsLocalized || field.localized,
            )
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

export const copyDataFromLocaleHandler = async (args: CopyDataFromLocaleArgs) => {
  const { req } = args

  try {
    return await copyDataFromLocale(args)
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error copying data from "${args.fromLocale}" to "${args.toLocale}"`,
    })

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
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

  const incomingUserSlug = user?.collection

  const adminUserSlug = payload.config.admin.user

  // If we have a user slug, test it against the functions
  if (incomingUserSlug) {
    const adminAccessFunction = payload.collections[incomingUserSlug].config.access?.admin

    // Run the admin access function from the config if it exists
    if (adminAccessFunction) {
      const canAccessAdmin = await adminAccessFunction({ req: args.req })

      if (!canAccessAdmin) {
        throw new Error('Unauthorized')
      }
      // Match the user collection to the global admin config
    } else if (adminUserSlug !== incomingUserSlug) {
      throw new Error('Unauthorized')
    }
  }

  const [fromLocaleData, toLocaleData] = await Promise.allSettled([
    globalSlug
      ? payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          locale: fromLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          depth: 0,
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
          locale: toLocale,
          overrideAccess: false,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          depth: 0,
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

  const { id, ...fromLocaleDataWithoutID } = fromLocaleData.value

  return globalSlug
    ? await payload.updateGlobal({
        slug: globalSlug,
        data: overrideData
          ? fromLocaleDataWithoutID
          : mergeData(
              fromLocaleData.value,
              toLocaleData.value,
              globals[globalSlug].config.fields,
              req,
              false,
            ),
        locale: toLocale,
        overrideAccess: false,
        req,
        user,
      })
    : await payload.update({
        id: docID,
        collection: collectionSlug,
        data: overrideData
          ? fromLocaleDataWithoutID
          : mergeData(
              fromLocaleData.value,
              toLocaleData.value,
              collections[collectionSlug].config.fields,
              req,
              false,
            ),
        locale: toLocale,
        overrideAccess: false,
        req,
        user,
      })
}
