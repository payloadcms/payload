import type { GraphQLResolveInfo } from 'graphql'
import type { PayloadRequest } from 'payload'

import {
  assertBranchReadable,
  getDataLoader,
  isolateObjectProperty,
  resetBranchState,
} from 'payload'

import type { Context } from './types.js'

type RequestsByOperation = WeakMap<
  GraphQLResolveInfo['operation'],
  Map<GraphQLResolveInfo['path']['key'], PayloadRequest>
>

const requestsByContext = new WeakMap<Context, RequestsByOperation>()

type GetGraphQLRequestArgs = {
  branch?: string
  collectionSlug?: string
  context: Context
  fallbackLocale?: PayloadRequest['fallbackLocale']
  globalSlug?: string
  info: GraphQLResolveInfo
  locale?: PayloadRequest['locale']
}

/**
 * Creates the request owned by one GraphQL root field.
 *
 * GraphQL resolves sibling query fields concurrently. Each field therefore needs its own mutable
 * request state, including its branch cache and DataLoader, while nested field resolvers need a
 * stable way to recover that same request after the root resolver has completed.
 */
export const getGraphQLRequest = async ({
  branch,
  collectionSlug,
  context,
  fallbackLocale,
  globalSlug,
  info,
  locale,
}: GetGraphQLRequestArgs): Promise<PayloadRequest> => {
  const req = isolateObjectProperty(context.req, [
    'branch',
    'context',
    'fallbackLocale',
    'locale',
    'payloadDataLoader',
    'query',
    'transactionID',
  ])

  req.context = { ...context.req.context }
  req.query = { ...context.req.query }

  if (typeof locale !== 'undefined') {
    req.locale = locale
  }

  if (typeof fallbackLocale !== 'undefined') {
    req.fallbackLocale = fallbackLocale
  }

  if (typeof branch !== 'undefined') {
    req.branch = branch
  }

  resetBranchState(req)
  req.payloadDataLoader = getDataLoader(req)

  registerGraphQLRequest({ context, info, req })

  await assertBranchReadable({ collectionSlug, globalSlug, req })

  return req
}

export const getGraphQLRequestForNestedField = ({
  context,
  info,
}: {
  context: Context
  info: GraphQLResolveInfo
}): PayloadRequest =>
  requestsByContext.get(context)?.get(info.operation)?.get(getRootPathKey(info.path)) ?? context.req

const getRootPathKey = (path: GraphQLResolveInfo['path']): GraphQLResolveInfo['path']['key'] => {
  while (path.prev) {
    path = path.prev
  }

  return path.key
}

const registerGraphQLRequest = ({
  context,
  info,
  req,
}: {
  context: Context
  info: GraphQLResolveInfo
  req: PayloadRequest
}): void => {
  let requestsByOperation = requestsByContext.get(context)

  if (!requestsByOperation) {
    requestsByOperation = new WeakMap()
    requestsByContext.set(context, requestsByOperation)
  }

  let requestsByRootPath = requestsByOperation.get(info.operation)

  if (!requestsByRootPath) {
    requestsByRootPath = new Map()
    requestsByOperation.set(info.operation, requestsByRootPath)
  }

  requestsByRootPath.set(getRootPathKey(info.path), req)
}
