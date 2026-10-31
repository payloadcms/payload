import type { Endpoint, PayloadRequest } from 'payload'

import { readFile } from 'fs/promises'
import path from 'path'
import { addDataAndFileToRequest } from 'payload'

import type { PersonalPhoto } from '../../payload-types'

import { describePhoto, isPhotoAIEnabled } from './describePhoto'

type StoredFile = { filename?: null | string; url?: null | string }

/**
 * The photo's 1600 px copy (or its file when it has none): from the server's disk, or else from S3,
 * where files are public (src/storage/s3.ts)
 */
async function loadPhoto(photo: PersonalPhoto, req: PayloadRequest) {
  const file: StoredFile = photo.variants?.max1600?.filename ? photo.variants.max1600 : photo
  const { staticDir } = req.payload.collections['personal-photos'].config.upload

  if (!file.filename) throw new Error('The photo has no file.')

  try {
    return await readFile(path.resolve(staticDir || '', file.filename))
  } catch {
    if (!file.url || !/^https?:\/\//.test(file.url)) throw new Error('The photo file is missing.')
  }

  const res = await fetch(file.url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Could not download the photo: ${res.status} ${res.statusText}`)

  return Buffer.from(await res.arrayBuffer())
}

/**
 * `POST /api/personal-photos/:id/generate-text` with `{ album, location }` from the edit form:
 * returns a new title, alt text, description and tags written by AI without saving them, so the
 * "Generate with AI" button (src/components/PhotoTextButton) can put them in the form for review.
 */
export const generateTextEndpoint: Endpoint = {
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Log in to generate texts.' }, { status: 401 })
    }

    if (!isPhotoAIEnabled) {
      return Response.json(
        { error: 'Set OPENAI_API_KEY in the CMS .env to write photo texts with AI.' },
        { status: 501 },
      )
    }

    await addDataAndFileToRequest(req)

    const { album, location } = (req.data ?? {}) as { album?: unknown; location?: unknown }

    try {
      const photo = await req.payload.findByID({
        id: String(req.routeParams?.id),
        collection: 'personal-photos',
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
      })

      const albumDoc =
        typeof album === 'string' || typeof album === 'number'
          ? await req.payload
              .findByID({
                id: album,
                collection: 'personal-photo-albums',
                depth: 0,
                disableErrors: true,
                draft: true,
                req,
                select: { title: true },
              })
              .catch(() => null)
          : null

      const text = await describePhoto({
        context: {
          album: albumDoc?.title,
          location: typeof location === 'string' ? location : photo.location,
        },
        image: await loadPhoto(photo, req),
        req,
      })

      return Response.json(text)
    } catch (error) {
      req.payload.logger.warn({ err: error, msg: 'Could not write photo texts with AI' })

      return Response.json({ error: (error as Error).message }, { status: 502 })
    }
  },
  method: 'post',
  path: '/:id/generate-text',
}
