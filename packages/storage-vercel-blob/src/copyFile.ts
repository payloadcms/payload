import type { PayloadRequest } from 'payload'

import { BlobNotFoundError, copy, del, head, put } from '@vercel/blob'

type Args = {
  access: 'public'
  cacheControlMaxAge: number
  from: string
  req?: PayloadRequest
  to: string
  token: string
}

export const copyVercelBlobFile = async ({
  access,
  cacheControlMaxAge,
  from,
  req,
  to,
  token,
}: Args): Promise<void> => {
  if (from === to) {
    throw new Error('Storage copy requires different source and destination keys')
  }

  const source = await head(from, { token })

  try {
    await head(to, { token })
    throw new Error(`Storage destination already exists: ${to}`)
  } catch (err) {
    if (!isBlobNotFound(err)) {
      throw err
    }
  }

  const sourceMaxAge = /(?:^|,)\s*max-age=(\d+)/.exec(source.cacheControl)
  let copied: { etag: string; pathname: string } | undefined = await copy(from, to, {
    access,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: sourceMaxAge ? Number(sourceMaxAge[1]) : cacheControlMaxAge,
    contentType: source.contentType,
    token,
  })

  try {
    if (copied.pathname !== to) {
      throw new Error(`Vercel Blob assigned an unexpected destination key: ${copied.pathname}`)
    }

    let destination = await head(to, { token })

    if (destination.size !== source.size) {
      await del(to, { ifMatch: copied.etag, token })
      // The first copy is gone; a rejected fallback must not delete another upload's object.
      copied = undefined

      const sourceResponse = await fetch(source.url)

      if (!sourceResponse.ok || !sourceResponse.body) {
        throw new Error(`Vercel Blob source is not readable: ${from}`)
      }

      copied = await put(to, sourceResponse.body, {
        access,
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: sourceMaxAge ? Number(sourceMaxAge[1]) : cacheControlMaxAge,
        contentType: source.contentType,
        token,
      })

      if (copied.pathname !== to) {
        throw new Error(`Vercel Blob assigned an unexpected destination key: ${copied.pathname}`)
      }

      destination = await head(to, { token })

      if (destination.size !== source.size) {
        throw new Error(`Copied Vercel Blob object is not readable at its expected length: ${to}`)
      }
    }
  } catch (err) {
    if (copied) {
      try {
        if (copied.pathname === from || !copied.etag) {
          throw new Error('Vercel Blob copy did not return a safe destination for cleanup')
        }
        await del(copied.pathname, { ifMatch: copied.etag, token })
      } catch (cleanupError) {
        req?.payload.logger.error({
          err: cleanupError,
          msg: `Failed to remove unsuccessful Vercel Blob copy at ${copied.pathname}`,
        })
      }
    }
    throw err
  }
}

const isBlobNotFound = (err: unknown): boolean =>
  err instanceof BlobNotFoundError ||
  (err !== null && typeof err === 'object' && 'name' in err && err.name === 'BlobNotFoundError')
