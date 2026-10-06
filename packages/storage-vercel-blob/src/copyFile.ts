import { BlobNotFoundError, copy, del, head, put } from '@vercel/blob'

type Args = {
  access: 'public'
  cacheControlMaxAge: number
  from: string
  to: string
  token: string
}

export const copyVercelBlobFile = async ({
  access,
  cacheControlMaxAge,
  from,
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
  const result = await copy(from, to, {
    access,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: sourceMaxAge ? Number(sourceMaxAge[1]) : cacheControlMaxAge,
    contentType: source.contentType,
    token,
  })

  if (result.pathname !== to) {
    throw new Error(`Vercel Blob assigned an unexpected destination key: ${result.pathname}`)
  }

  let destination = await head(to, { token })

  if (destination.size !== source.size) {
    await del(to, { ifMatch: result.etag, token })

    const sourceResponse = await fetch(source.url)

    if (!sourceResponse.ok || !sourceResponse.body) {
      throw new Error(`Vercel Blob source is not readable: ${from}`)
    }

    await put(to, sourceResponse.body, {
      access,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: sourceMaxAge ? Number(sourceMaxAge[1]) : cacheControlMaxAge,
      contentType: source.contentType,
      token,
    })
    destination = await head(to, { token })

    if (destination.size !== source.size) {
      throw new Error(`Copied Vercel Blob object is not readable at its expected length: ${to}`)
    }
  }
}

const isBlobNotFound = (err: unknown): boolean =>
  err instanceof BlobNotFoundError ||
  (err !== null && typeof err === 'object' && 'name' in err && err.name === 'BlobNotFoundError')
