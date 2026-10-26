import type { Endpoint } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { CreateUploadSessionArgs } from './operations.js'

import { APIError } from '../../errors/index.js'
import {
  cancelUploadSession,
  completeUploadSession,
  completeUploadSessionStorage,
  createUploadSession,
  getUploadSession,
  getUploadSessionInstructions,
  listUploadSessions,
  setUploadSessionIntent,
} from './operations.js'

/**
 * Purpose-built session routes. They are collection endpoints on the internal sessions
 * collection, so they are matched before (and shadow) the generic CRUD routes, which are closed
 * through deny-all access.
 */
export const uploadSessionEndpoints: Endpoint[] = [
  {
    handler: async (req) => {
      const body = await readJSONBody(req)

      if (!isCreateUploadSessionBody(body)) {
        throw new APIError('Invalid upload session request.', 400)
      }

      return Response.json(
        await createUploadSession({
          collectionSlug: body.collectionSlug,
          docPrefix: body.docPrefix,
          file: {
            filename: body.file.filename,
            lastModified: body.file.lastModified,
            mimeType: body.file.mimeType,
            size: body.file.size,
          },
          operation: body.operation,
          req,
          targetID: body.targetID,
        }),
        { status: 201 },
      )
    },
    method: 'post',
    path: '/',
  },
  {
    handler: async (req) => Response.json({ docs: await listUploadSessions({ req }) }),
    method: 'get',
    path: '/',
  },
  {
    handler: async (req) => Response.json(await getUploadSession({ id: getSessionID(req), req })),
    method: 'get',
    path: '/:id',
  },
  {
    handler: async (req) =>
      Response.json(await getUploadSessionInstructions({ id: getSessionID(req), req })),
    method: 'post',
    path: '/:id/instructions',
  },
  {
    handler: async (req) =>
      Response.json(await completeUploadSessionStorage({ id: getSessionID(req), req })),
    method: 'post',
    path: '/:id/storage',
  },
  {
    handler: async (req) => {
      const body = parseDocumentDataBody({ body: await readJSONBody(req), isDataRequired: true })

      if (!body?.data) {
        throw new APIError('Invalid upload session intent request.', 400)
      }

      return Response.json(
        await setUploadSessionIntent({
          id: getSessionID(req),
          data: body.data,
          draft: body.draft,
          req,
        }),
      )
    },
    // POST, not PUT: older generated Next.js route files do not export a PUT handler.
    method: 'post',
    path: '/:id/intent',
  },
  {
    handler: async (req) => {
      // The body is optional: without `data` the stored intent is used.
      const body = parseDocumentDataBody({
        body: await readJSONBody(req, { isOptional: true }),
        isDataRequired: false,
      })

      if (!body) {
        throw new APIError('Invalid upload session completion request.', 400)
      }

      return Response.json(
        await completeUploadSession({
          id: getSessionID(req),
          data: body.data,
          draft: body.draft,
          req,
        }),
      )
    },
    method: 'post',
    path: '/:id/complete',
  },
  {
    handler: async (req) =>
      Response.json(await cancelUploadSession({ id: getSessionID(req), req })),
    method: 'delete',
    path: '/:id',
  },
]

const getSessionID = (req: PayloadRequest): string => {
  const id = req.routeParams?.id

  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new APIError('Missing upload session ID.', 400)
  }

  return String(id)
}

const readJSONBody = async (
  req: PayloadRequest,
  { isOptional = false }: { isOptional?: boolean } = {},
): Promise<unknown> => {
  const text = req.text ? await req.text() : ''

  if (!text) {
    if (isOptional) {
      return {}
    }

    throw new APIError('Content-Type expected to be application/json', 400)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new APIError('Invalid JSON body.', 400)
  }
}

type CreateUploadSessionBody = Omit<CreateUploadSessionArgs, 'req'>

const isCreateUploadSessionBody = (body: unknown): body is CreateUploadSessionBody => {
  if (typeof body !== 'object' || body === null) {
    return false
  }

  const { collectionSlug, docPrefix, file, operation, targetID } = body as Record<string, unknown>

  if (
    typeof collectionSlug !== 'string' ||
    (operation !== 'create' && operation !== 'update') ||
    (docPrefix !== undefined && typeof docPrefix !== 'string') ||
    (targetID !== undefined && typeof targetID !== 'string') ||
    typeof file !== 'object' ||
    file === null
  ) {
    return false
  }

  const { filename, lastModified, mimeType, size } = file as Record<string, unknown>

  return (
    typeof filename === 'string' &&
    typeof mimeType === 'string' &&
    Number.isSafeInteger(size) &&
    (size as number) > 0 &&
    (lastModified === undefined || Number.isSafeInteger(lastModified))
  )
}

/** Returns the validated document data body, or null when the shape is invalid. */
const parseDocumentDataBody = ({
  body,
  isDataRequired,
}: {
  body: unknown
  isDataRequired: boolean
}): { data?: Record<string, unknown>; draft?: boolean } | null => {
  if (typeof body !== 'object' || body === null) {
    return null
  }

  const { data, draft } = body as Record<string, unknown>
  const isDataValid =
    data === undefined
      ? !isDataRequired
      : typeof data === 'object' && data !== null && !Array.isArray(data)

  if (!isDataValid || (draft !== undefined && typeof draft !== 'boolean')) {
    return null
  }

  return { data: data as Record<string, unknown> | undefined, draft }
}
