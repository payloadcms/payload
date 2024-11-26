import {
  type CollectionSlug,
  type Data,
  type Field,
  formatErrors,
  type PayloadRequest,
} from 'payload'
import { fieldAffectsData, tabHasName } from 'payload/shared'

export type CopyDataFromLocaleArgs = {
  collectionSlug?: CollectionSlug
  docID?: number | string
  fromLocale: string
  globalSlug?: string
  overrideData?: boolean
  req: PayloadRequest
  toLocale: string
}

function iterateFields(fields: Field[], fromLocaleData: Data, toLocaleData: Data): void {
  fields.map((field) => {
    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array':
        case 'blocks':
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
            toLocaleData[field.name] === undefined &&
            fromLocaleData?.[field.name] !== undefined
          ) {
            toLocaleData[field.name] = fromLocaleData[field.name]
          }
          break

        case 'group': {
          if (field.name in toLocaleData && fromLocaleData?.[field.name] !== undefined) {
            iterateFields(field.fields, fromLocaleData[field.name], toLocaleData[field.name])
          }
          break
        }
      }
    } else {
      switch (field.type) {
        case 'collapsible':
        case 'row':
          iterateFields(field.fields, fromLocaleData, toLocaleData)
          break

        case 'tabs':
          field.tabs.map((tab) => {
            if (tabHasName(tab)) {
              if (tab.name in toLocaleData && fromLocaleData?.[tab.name] !== undefined) {
                iterateFields(tab.fields, fromLocaleData[tab.name], toLocaleData[tab.name])
              }
            } else {
              iterateFields(tab.fields, fromLocaleData, toLocaleData)
            }
          })
          break
      }
    }
  })
}

function mergeData(fromLocaleData: Data, toLocaleData: Data, fields: Field[]): Data {
  iterateFields(fields, fromLocaleData, toLocaleData)

  return toLocaleData
}

export const copyDataFromLocaleHandler = async (args: CopyDataFromLocaleArgs) => {
  const { req } = args

  try {
    const res = await copyDataFromLocale(args)
    return res
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
          locale: fromLocale,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          locale: fromLocale,
          user,
          // `select` would allow us to select only the fields we need in the future
        }),
    globalSlug
      ? payload.findGlobal({
          slug: globalSlug,
          locale: toLocale,
          user,
          // `select` would allow us to select only the fields we need in the future
        })
      : payload.findByID({
          id: docID,
          collection: collectionSlug,
          locale: toLocale,
          user,
          // `select` would allow us to select only the fields we need in the future
        }),
  ])

  if (fromLocaleData.status === 'rejected' || toLocaleData.status === 'rejected') {
    // not sure what the return type should be yet
    return
  }

  const newToLocaleData = globalSlug
    ? await payload.updateGlobal({
        slug: globalSlug,
        data: overrideData
          ? fromLocaleData.value
          : mergeData(fromLocaleData.value, toLocaleData.value, globals[globalSlug].config.fields),
        locale: toLocale,
        user,
      })
    : await payload.update({
        id: docID,
        collection: collectionSlug,
        data: overrideData
          ? fromLocaleData.value
          : mergeData(
              fromLocaleData.value,
              toLocaleData.value,
              collections[collectionSlug].config.fields,
            ),
        locale: toLocale,
        user,
      })

  // return success
}
