import type { z } from 'zod'

import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { Endpoint } from '../config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type { OperationHandler, OperationTarget, PayloadOperation } from './defineOperation.js'

import {
  getRequestCollection,
  getRequestCollectionWithID,
  getRequestGlobal,
} from '../utilities/getRequestEntity.js'
import { headersWithCors } from '../utilities/headersWithCors.js'
import { isNumber } from '../utilities/isNumber.js'
import { parseParams } from '../utilities/parseParams/index.js'
import { sanitizePopulateParam } from '../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../utilities/sanitizeSelectParam.js'
import { sanitizeSortParams } from '../utilities/sanitizeSortParams.js'
import { wrapInternalEndpoints } from '../utilities/wrapInternalEndpoints.js'
import { invokeOperation } from './defineOperation.js'

type RESTOperation = {
  action: string
  expose: {
    rest?: ReadonlyArray<
      {
        handler?: (...args: never[]) => unknown
        wrapInternal?: boolean
      } & Omit<Endpoint, 'handler'>
    >
  }
  handler: (context: unknown, input: unknown) => Promise<unknown>
  input: {
    parse: (input: unknown) => unknown
  }
  target: OperationTarget
}

type BulkResult = {
  docs: unknown[]
  errors: Array<{ isPublic?: boolean; message: string }>
}

type InvokableRESTOperation = PayloadOperation<
  OperationHandler<unknown, unknown, unknown>,
  z.ZodType
>

const invokeRESTOperation = (
  operation: RESTOperation,
  req: PayloadRequest,
  input: Record<string, unknown>,
): Promise<unknown> =>
  invokeOperation(operation as unknown as InvokableRESTOperation, {
    context: req.payload,
    input,
    validate: false,
  })

const responseWithCORS = (
  data: unknown,
  req: PayloadRequest,
  status: number = httpStatus.OK,
): Response =>
  Response.json(data, {
    headers: headersWithCors({ headers: new Headers(), req }),
    status,
  })

const handleCollectionOperation = async (
  operation: RESTOperation,
  endpoint: Omit<Endpoint, 'handler'>,
  req: PayloadRequest,
): Promise<Response> => {
  const action = operation.action

  if (action === 'count') {
    const collection = getRequestCollection(req)
    const { trash, where } = parseParams(req.query)
    const result = await invokeRESTOperation(operation, req, {
      collection: collection.config.slug,
      overrideAccess: false,
      req,
      trash,
      where,
    })

    return Response.json(result, { status: httpStatus.OK })
  }

  if (action === 'create') {
    const collection = getRequestCollection(req)
    const { autosave, depth, draft, populate, publishAllLocales, select } = parseParams(req.query)
    const doc = await invokeRESTOperation(operation, req, {
      autosave,
      collection: collection.config.slug,
      data: req.data!,
      depth,
      draft,
      file: req.file,
      overrideAccess: false,
      populate,
      publishAllLocales,
      req,
      select,
    })

    return responseWithCORS(
      {
        doc,
        message: req.t('general:successfullyCreated', {
          label: getTranslation(collection.config.labels.singular, req.i18n),
        }),
      },
      req,
      httpStatus.CREATED,
    )
  }

  if (action === 'delete') {
    if (endpoint.path === '/:id') {
      const { id, collection } = getRequestCollectionWithID(req)
      const { depth, overrideLock, populate, select, trash } = parseParams(req.query)
      const doc = await invokeRESTOperation(operation, req, {
        id,
        collection: collection.config.slug,
        depth,
        overrideAccess: false,
        overrideLock: overrideLock ?? false,
        populate,
        req,
        select,
        trash,
      })

      return doc
        ? responseWithCORS({ doc, message: req.t('general:deletedSuccessfully') }, req)
        : responseWithCORS({ message: req.t('general:notFound') }, req, httpStatus.NOT_FOUND)
    }

    const collection = getRequestCollection(req)
    const { depth, overrideLock, populate, select, trash, where } = parseParams(req.query)
    const result = (await invokeRESTOperation(operation, req, {
      collection: collection.config.slug,
      depth,
      overrideAccess: false,
      overrideLock: overrideLock ?? false,
      populate,
      req,
      select,
      trash,
      where: where!,
    })) as BulkResult
    const headers = headersWithCors({ headers: new Headers(), req })

    if (result.errors.length === 0) {
      return Response.json(
        {
          ...result,
          message: req.t('general:deletedCountSuccessfully', {
            count: result.docs.length,
            label: getTranslation(
              collection.config.labels[result.docs.length === 1 ? 'singular' : 'plural'],
              req.i18n,
            ),
          }),
        },
        { headers, status: httpStatus.OK },
      )
    }

    result.errors = result.errors.map((error) =>
      error.isPublic ? error : { ...error, message: 'Something went wrong.' },
    )
    const total = result.docs.length + result.errors.length

    return Response.json(
      {
        ...result,
        message: req.t('error:unableToDeleteCount', {
          count: result.errors.length,
          label: getTranslation(
            collection.config.labels[total === 1 ? 'singular' : 'plural'],
            req.i18n,
          ),
          total,
        }),
      },
      { headers, status: httpStatus.BAD_REQUEST },
    )
  }

  if (action === 'docAccess') {
    const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })
    const result = await invokeRESTOperation(operation, req, {
      id,
      collection: collection.config.slug,
      data: req.data,
      req,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'duplicate') {
    const { id, collection } = getRequestCollectionWithID(req)
    const { depth, draft = true, populate, select, selectedLocales } = parseParams(req.query)
    const doc = await invokeRESTOperation(operation, req, {
      id,
      collection: collection.config.slug,
      data: req.data,
      depth,
      draft,
      overrideAccess: false,
      populate,
      req,
      select,
      selectedLocales,
    })

    return responseWithCORS(
      {
        doc,
        message: req.t('general:successfullyDuplicated', {
          label: getTranslation(collection.config.labels.singular, req.i18n),
        }),
      },
      req,
    )
  }

  if (action === 'find') {
    const collection = getRequestCollection(req)
    const { depth, draft, joins, limit, page, pagination, populate, select, sort, trash, where } =
      parseParams(req.query)
    const result = await invokeRESTOperation(operation, req, {
      collection: collection.config.slug,
      depth,
      draft,
      joins,
      limit,
      overrideAccess: false,
      page,
      pagination,
      populate,
      req,
      select,
      sort,
      trash,
      where,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'findByID') {
    const { data: dataArg } = req
    const { id, collection } = getRequestCollectionWithID(req)
    const { data, depth, draft, flattenLocales, joins, populate, select, trash } = parseParams({
      ...req.query,
      ...dataArg,
    })
    const result = await invokeRESTOperation(operation, req, {
      id,
      collection: collection.config.slug,
      data,
      depth,
      draft,
      flattenLocales,
      joins,
      overrideAccess: false,
      populate,
      req,
      select,
      trash,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'findVersionByID') {
    const { depth, populate, select, trash } = parseParams(req.query)
    const { id, collection } = getRequestCollectionWithID(req)
    const result = await invokeRESTOperation(operation, req, {
      id: String(id),
      collection: collection.config.slug,
      depth,
      overrideAccess: false,
      populate,
      req,
      select,
      trash,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'findVersions') {
    const { depth, limit, page, pagination, populate, select, sort, trash, where } = parseParams(
      req.query,
    )
    const collection = getRequestCollection(req)
    const result = await invokeRESTOperation(operation, req, {
      collection: collection.config.slug,
      depth,
      limit,
      overrideAccess: false,
      page,
      pagination,
      populate,
      req,
      select,
      sort,
      trash,
      where,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'restoreVersion') {
    const { id, collection } = getRequestCollectionWithID(req)
    const { depth, draft, populate } = parseParams(req.query)
    const result = (await invokeRESTOperation(operation, req, {
      id: String(id),
      collection: collection.config.slug,
      depth,
      draft,
      overrideAccess: false,
      populate,
      req,
    })) as Record<string, unknown>

    return responseWithCORS({ ...result, message: req.t('version:restoredSuccessfully') }, req)
  }

  if (action === 'update') {
    if (endpoint.path === '/:id') {
      const { id, collection } = getRequestCollectionWithID(req)
      const {
        autosave,
        depth,
        draft,
        overrideLock,
        populate,
        publishAllLocales,
        select,
        trash,
        unpublishAllLocales,
      } = parseParams(req.query)
      const doc = await invokeRESTOperation(operation, req, {
        id,
        autosave,
        collection: collection.config.slug,
        data: req.data!,
        depth,
        draft,
        file: req.file,
        overrideAccess: false,
        overrideLock: overrideLock ?? false,
        populate,
        publishAllLocales,
        req,
        select,
        trash,
        unpublishAllLocales,
      })
      let message = req.t('general:updatedSuccessfully')
      if (draft) {
        message = req.t('version:draftSavedSuccessfully')
      }
      if (autosave) {
        message = req.t('version:autosavedSuccessfully')
      }

      return responseWithCORS({ doc, message }, req)
    }

    const collection = getRequestCollection(req)
    const {
      depth,
      draft,
      limit,
      overrideLock,
      populate,
      publishAllLocales,
      select,
      sort,
      trash,
      unpublishAllLocales,
      where,
    } = parseParams(req.query)
    const result = (await invokeRESTOperation(operation, req, {
      collection: collection.config.slug,
      data: req.data!,
      depth,
      draft,
      file: req.file,
      limit,
      overrideAccess: false,
      overrideLock: overrideLock ?? false,
      populate,
      publishAllLocales,
      req,
      select,
      sort,
      trash,
      unpublishAllLocales,
      where: where!,
    })) as BulkResult
    const headers = headersWithCors({ headers: new Headers(), req })

    if (result.errors.length === 0) {
      return Response.json(
        {
          ...result,
          message: req.t('general:updatedCountSuccessfully', {
            count: result.docs.length,
            label: getTranslation(
              collection.config.labels[result.docs.length === 1 ? 'singular' : 'plural'],
              req.i18n,
            ),
          }),
        },
        { headers, status: httpStatus.OK },
      )
    }

    result.errors = result.errors.map((error) =>
      error.isPublic ? error : { ...error, message: 'Something went wrong.' },
    )
    const total = result.docs.length + result.errors.length

    return Response.json(
      {
        ...result,
        message: req.t('error:unableToUpdateCount', {
          count: result.errors.length,
          label: getTranslation(
            collection.config.labels[total === 1 ? 'singular' : 'plural'],
            req.i18n,
          ),
          total,
        }),
      },
      { headers, status: httpStatus.BAD_REQUEST },
    )
  }

  throw new Error(`No generic REST adapter for collection:${action}`)
}

const handleGlobalOperation = async (
  operation: RESTOperation,
  req: PayloadRequest,
): Promise<Response> => {
  const action = operation.action
  const globalConfig = getRequestGlobal(req)

  if (action === 'docAccess') {
    const result = await invokeRESTOperation(operation, req, {
      data: req.data,
      global: globalConfig.slug,
      req,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'find') {
    const { data, searchParams } = req
    const depth = data ? data.depth : searchParams.get('depth')
    const flattenLocales = data
      ? data.flattenLocales
      : searchParams.has('flattenLocales')
        ? searchParams.get('flattenLocales') === 'true'
        : undefined
    const result = await invokeRESTOperation(operation, req, {
      slug: globalConfig.slug,
      data: data
        ? data.data
        : searchParams.get('data')
          ? JSON.parse(searchParams.get('data') as string)
          : undefined,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft: data ? data.draft : searchParams.get('draft') === 'true',
      flattenLocales,
      overrideAccess: false,
      populate: sanitizePopulateParam(req.query.populate),
      req,
      select: sanitizeSelectParam(req.query.select),
    })

    return responseWithCORS(result, req)
  }

  if (action === 'findVersionByID') {
    const depth = req.searchParams.get('depth')
    const result = await invokeRESTOperation(operation, req, {
      id: req.routeParams!.id as string,
      slug: globalConfig.slug,
      depth: isNumber(depth) ? Number(depth) : undefined,
      overrideAccess: false,
      populate: sanitizePopulateParam(req.query.populate),
      req,
      select: sanitizeSelectParam(req.query.select),
    })

    return responseWithCORS(result, req)
  }

  if (action === 'findVersions') {
    const { depth, limit, page, pagination, populate, select, sort, where } = req.query
    const result = await invokeRESTOperation(operation, req, {
      slug: globalConfig.slug,
      depth: isNumber(depth) ? Number(depth) : undefined,
      limit: isNumber(limit) ? Number(limit) : undefined,
      overrideAccess: false,
      page: isNumber(page) ? Number(page) : undefined,
      pagination: pagination === 'false' ? false : undefined,
      populate: sanitizePopulateParam(populate),
      req,
      select: sanitizeSelectParam(select),
      sort: sanitizeSortParams(sort),
      where: where as Where,
    })

    return responseWithCORS(result, req)
  }

  if (action === 'restoreVersion') {
    const depth = req.searchParams.get('depth')
    const draft = req.searchParams.get('draft')
    const doc = await invokeRESTOperation(operation, req, {
      id: req.routeParams!.id as string,
      slug: globalConfig.slug,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft: draft === 'true' ? true : undefined,
      overrideAccess: false,
      populate: sanitizePopulateParam(req.query.populate),
      req,
    })

    return responseWithCORS({ doc, message: req.t('version:restoredSuccessfully') }, req)
  }

  if (action === 'update') {
    const depth = req.searchParams.get('depth')
    const draft = req.searchParams.get('draft') === 'true'
    const autosave = req.searchParams.get('autosave') === 'true'
    const result = await invokeRESTOperation(operation, req, {
      slug: globalConfig.slug,
      autosave,
      data: req.data!,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft,
      overrideAccess: false,
      populate: sanitizePopulateParam(req.query.populate),
      publishAllLocales: req.searchParams.get('publishAllLocales') === 'true',
      req,
      select: sanitizeSelectParam(req.query.select),
      unpublishAllLocales: req.searchParams.get('unpublishAllLocales') === 'true',
    })
    let message = req.t('general:updatedSuccessfully')
    if (draft) {
      message = req.t('version:draftSavedSuccessfully')
    }
    if (autosave) {
      message = req.t('version:autosavedSuccessfully')
    }

    return responseWithCORS({ message, result }, req)
  }

  throw new Error(`No generic REST adapter for global:${action}`)
}

const handleGenericRESTOperation = (
  operation: RESTOperation,
  endpoint: Omit<Endpoint, 'handler'>,
  req: PayloadRequest,
): Promise<Response> => {
  if (operation.target === 'collection') {
    return handleCollectionOperation(operation, endpoint, req)
  }

  if (operation.target === 'global') {
    return handleGlobalOperation(operation, req)
  }

  throw new Error(`No generic REST adapter for ${operation.target}:${operation.action}`)
}

/** Materializes REST endpoints from the operation registry. */
export const operationsToRESTEndpoints = (
  operations: readonly object[],
  target: OperationTarget,
): Endpoint[] => {
  return (operations as unknown as readonly RESTOperation[])
    .filter((operation) => operation.target === target)
    .flatMap((operation) =>
      (operation.expose.rest ?? []).map(({ handler, wrapInternal = true, ...endpoint }) => {
        const generatedEndpoint: Endpoint = {
          ...endpoint,
          handler: handler
            ? (req) =>
                (
                  handler as (args: {
                    invoke: (args: {
                      context: unknown
                      input: unknown
                      validate?: boolean
                    }) => Promise<unknown>
                    operation: RESTOperation
                    req: PayloadRequest
                  }) => ReturnType<Endpoint['handler']>
                )({
                  invoke: ({ context, input, validate }) =>
                    invokeOperation(operation as unknown as InvokableRESTOperation, {
                      context,
                      input,
                      validate,
                    }),
                  operation,
                  req,
                })
            : (req) => handleGenericRESTOperation(operation, endpoint, req),
        }

        return wrapInternal ? wrapInternalEndpoints([generatedEndpoint])[0]! : generatedEndpoint
      }),
    )
}
