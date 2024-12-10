import type {
  BuildTableStateArgs,
  ClientCollectionConfig,
  ClientConfig,
  ErrorResult,
  PaginatedDocs,
  SanitizedCollectionConfig,
} from 'payload'

import { dequal } from 'dequal/lite'
import { formatErrors } from 'payload'

import type { Column } from '../elements/Table/index.js'
import type { ListPreferences } from '../elements/TableColumns/index.js'

import { getClientConfig } from './getClientConfig.js'
import { renderFilters, renderTable } from './renderTable.js'

type BuildTableStateSuccessResult = {
  clientConfig?: ClientConfig
  data: PaginatedDocs
  errors?: never
  preferences: ListPreferences
  renderedFilters: Map<string, React.ReactNode>
  state: Column[]
  Table: React.ReactNode
}

type BuildTableStateErrorResult = {
  data?: any
  renderedFilters?: never
  state?: never
  Table?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildTableStateResult = BuildTableStateErrorResult | BuildTableStateSuccessResult

export const buildTableStateHandler = async (
  args: BuildTableStateArgs,
): Promise<BuildTableStateResult> => {
  const { req } = args

  try {
    const res = await buildTableState(args)
    return res
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return {
        message: err.message,
      }
    }

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
  }
}

export const buildTableState = async (
  args: BuildTableStateArgs,
): Promise<BuildTableStateSuccessResult> => {
  const {
    collectionSlug,
    columns,
    docs: docsFromArgs,
    enableRowSelections,
    query,
    renderRowTypes,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    tableAppearance,
  } = args

  const incomingUserSlug = user?.collection

  const adminUserSlug = config.admin.user

  // If we have a user slug, test it against the functions
  if (incomingUserSlug) {
    const adminAccessFunction = payload.collections[incomingUserSlug].config.access?.admin

    // Run the admin access function from the config if it exists
    if (adminAccessFunction) {
      const canAccessAdmin = await adminAccessFunction({ req })

      if (!canAccessAdmin) {
        throw new Error('Unauthorized')
      }

      // Match the user collection to the global admin config
    } else if (adminUserSlug !== incomingUserSlug) {
      throw new Error('Unauthorized')
    }
  } else {
    const hasUsers = await payload.find({
      collection: adminUserSlug,
      depth: 0,
      limit: 1,
      pagination: false,
    })

    // If there are users, we should not allow access because of /create-first-user
    if (hasUsers.docs.length) {
      throw new Error('Unauthorized')
    }
  }

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
  })

  let collectionConfig: SanitizedCollectionConfig
  let clientCollectionConfig: ClientCollectionConfig

  if (req.payload.collections[collectionSlug]) {
    collectionConfig = req.payload.collections[collectionSlug].config
    clientCollectionConfig = clientConfig.collections.find(
      (collection) => collection.slug === collectionSlug,
    )
  }

  // get prefs, then set update them using the columns that we just received
  const preferencesKey = `${collectionSlug}-list`

  const preferencesResult = await payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            key: {
              equals: preferencesKey,
            },
          },
          {
            'user.relationTo': {
              equals: user.collection,
            },
          },
          {
            'user.value': {
              equals: user.id,
            },
          },
        ],
      },
    })
    .then((res) => res.docs[0] ?? { id: null, value: {} })

  let newPrefs = preferencesResult.value

  if (!preferencesResult.id || !dequal(columns, preferencesResult?.columns)) {
    const preferencesArgs = {
      collection: 'payload-preferences',
      data: {
        key: preferencesKey,
        user: {
          collection: user.collection,
          value: user.id,
        },
        value: {
          ...(preferencesResult?.value || {}),
          columns,
        },
      },
      depth: 0,
      req,
    }

    if (preferencesResult.id) {
      newPrefs = await payload
        .update({
          ...preferencesArgs,
          id: preferencesResult.id,
        })
        ?.then((res) => res.value as ListPreferences)
    } else {
      newPrefs = await payload.create(preferencesArgs)?.then((res) => res.value as ListPreferences)
    }
  }

  let docs = docsFromArgs
  let data: PaginatedDocs

  // lookup docs, if desired, i.e. within `join` field which initialize with `depth: 0`

  if (!docs || query) {
    data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: query?.limit ? parseInt(query.limit, 10) : undefined,
      page: query?.page ? parseInt(query.page, 10) : undefined,
      sort: query?.sort,
      where: query?.where,
    })

    docs = data.docs
  }

  const { columnState, Table } = renderTable({
    clientCollectionConfig,
    collectionConfig,
    columnPreferences: undefined, // TODO, might not be needed
    columns,
    docs,
    enableRowSelections,
    i18n: req.i18n,
    payload,
    renderRowTypes,
    tableAppearance,
    useAsTitle: collectionConfig.admin.useAsTitle,
  })

  const renderedFilters = renderFilters(collectionConfig.fields, req.payload.importMap)

  return {
    data,
    preferences: newPrefs,
    renderedFilters,
    state: columnState,
    Table,
  }
}
