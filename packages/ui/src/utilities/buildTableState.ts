import type {
  BuildTableStateArgs,
  ClientCollectionConfig,
  ClientConfig,
  ErrorResult,
  ListPreferences,
  PaginatedDocs,
  SanitizedCollectionConfig,
} from 'payload'

import { formatErrors } from 'payload'
import { isNumber } from 'payload/shared'

import type { Column } from '../elements/Table/index.js'

import { getClientConfig } from './getClientConfig.js'
import { renderFilters, renderTable } from './renderTable.js'
import { upsertPreferences } from './upsertPreferences.js'

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

  const listPreferences = await upsertPreferences<ListPreferences>({
    key: `${collectionSlug}-list`,
    req,
    value: {
      columns,
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      sort: query?.sort as string,
    },
  })

  let docs = docsFromArgs
  let data: PaginatedDocs

  // lookup docs, if desired, i.e. within `join` field which initialize with `depth: 0`

  if (!docs || query) {
    data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: query?.limit ? parseInt(query.limit, 10) : undefined,
      overrideAccess: false,
      page: query?.page ? parseInt(query.page, 10) : undefined,
      sort: query?.sort,
      user: req.user,
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
    preferences: listPreferences,
    renderedFilters,
    state: columnState,
    Table,
  }
}
