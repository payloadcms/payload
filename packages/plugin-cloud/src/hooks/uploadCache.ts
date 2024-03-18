import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
} from 'payload/types'

interface Args {
  endpoint: string
}

type GenericUpload = {
  id: string
  sizes?: Record<string, { url?: string }>
  url?: string
}

export const getCacheUploadsAfterChangeHook =
  ({ endpoint }: Args): CollectionAfterChangeHook<GenericUpload> =>
  async ({ doc, operation, req }) => {
    if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) return doc

    const { res } = req
    if (res) {
      if (operation === 'update') {
        // Unawaited promise
        purge({ doc, endpoint, operation, req })
      }
    }
    return doc
  }

export const getCacheUploadsAfterDeleteHook =
  ({ endpoint }: Args): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) return doc

    const { res } = req
    if (res) {
      // Unawaited promise
      purge({ doc, endpoint, operation: 'delete', req })
    }
    return doc
  }

type PurgeRequest = {
  doc: GenericUpload
  endpoint: string
  operation: string
  req: PayloadRequest
}

async function purge({ doc, endpoint, operation, req }: PurgeRequest) {
  const filePath = doc.url

  if (!filePath) {
    req.payload.logger.error({
      msg: 'No url found on doc',
      project: {
        id: process.env.PAYLOAD_CLOUD_PROJECT_ID,
      },
    })
    return
  }

  const filepaths = [filePath]
  try {
    if (doc.sizes && Object.keys(doc.sizes).length) {
      const urls = Object.values(doc.sizes)
        .map((size) => size?.url)
        .filter(Boolean)
      filepaths.push(...urls)
    }

    const body = {
      cacheKey: process.env.PAYLOAD_CLOUD_CACHE_KEY,
      filepaths,
      projectID: process.env.PAYLOAD_CLOUD_PROJECT_ID,
    }

    req.payload.logger.debug({
      filepaths,
      msg: 'Purging cache for filepaths',
      operation,
      project: {
        id: process.env.PAYLOAD_CLOUD_PROJECT_ID,
      },
    })

    const purgeRes = await fetch(`${endpoint}/api/purge-cache`, {
      body: JSON.stringify({
        ...body,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    req.payload.logger.debug({
      msg: 'Purge cache result',
      operation,
      statusCode: purgeRes.status,
    })
  } catch (err: unknown) {
    req.payload.logger.error({
      data: { id: doc.id, filepaths },
      err,
      msg: '/purge-cache call failed',
    })
  }
}
