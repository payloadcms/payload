import { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload/types'

interface Args {
  endpoint: string
}

export const getCacheUploadsAfterChangeHook =
  ({ endpoint }: Args): CollectionAfterChangeHook =>
  async ({ operation, req, doc }) => {
    if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) return doc

    const { res } = req
    if (res) {
      if (operation === 'update') {
        // Unawaited promise
        purge({ endpoint, doc, req, operation })
      }
    }
    return doc
  }

export const getCacheUploadsAfterDeleteHook =
  ({ endpoint }: Args): CollectionAfterDeleteHook =>
  async ({ req, doc }) => {
    if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) return doc

    const { res } = req
    if (res) {
      // Unawaited promise
      purge({ endpoint, doc, req, operation: 'delete' })
    }
    return doc
  }

type PurgeRequest = {
  endpoint: string
  doc: any
  req: PayloadRequest
  operation: string
}

async function purge({ endpoint, doc, req, operation }: PurgeRequest) {
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

  const body = {
    projectID: process.env.PAYLOAD_CLOUD_PROJECT_ID,
    cacheKey: process.env.PAYLOAD_CLOUD_CACHE_KEY,
    filepath: doc.url,
  }
  req.payload.logger.debug({
    msg: 'Attempting to purge cache',
    project: {
      id: process.env.PAYLOAD_CLOUD_PROJECT_ID,
    },
    operation,
    filepath: doc.url,
  })

  try {
    const purgeRes = await fetch(`${endpoint}/api/purge-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
      }),
    })

    req.payload.logger.debug({
      msg: 'Purge cache result',
      statusCode: purgeRes.status,
      operation,
    })
  } catch (err: unknown) {
    req.payload.logger.error({ msg: '/purge-cache call failed', err, body })
  }
}
