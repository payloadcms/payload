import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { UploadTransformer } from '../../transformers/types.js'
import type { PlannedHookOwner } from '../../transformState/planUpload.js'
import type { UploadStages } from '../plan/planUploadStages.js'

import { describe, expect, it, vi } from 'vitest'

import { ValidationError } from '../../../errors/index.js'
import { getRangeRequestInfo } from '../../getRangeRequestInfo.js'
import {
  getCheckedClientUploadSource,
  hasDeferredContentChecks,
  shouldReadClientUploadByRanges,
} from './readClientUploadByRanges.js'

/** An `ftyp` box and an `mdat` box that fill the file. */
const createMP4 = ({ mediaDataSize }: { mediaDataSize: number }): Buffer => {
  const fileTypeBox = Buffer.concat([
    Buffer.from([0, 0, 0, 24]),
    Buffer.from('ftypisom'),
    Buffer.alloc(4),
    Buffer.from('isomiso2'),
  ])
  const mediaDataBox = Buffer.alloc(mediaDataSize)
  mediaDataBox.writeUInt32BE(mediaDataSize)
  mediaDataBox.write('mdat', 4, 'latin1')

  return Buffer.concat([fileTypeBox, mediaDataBox])
}

const MINIMAL_MP4 = createMP4({ mediaDataSize: 10_000 })

// A minimal valid 1x1 transparent PNG, so `file-type` can detect `image/png` from it.
const PNG_SIGNATURE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
)

const probedClientUpload = {
  name: 'clip.mp4',
  data: Buffer.alloc(0),
  mimetype: 'video/mp4',
  size: 1000,
  uploadReference: { prefix: '' },
} as NonNullable<PayloadRequest['file']>

const posterTransformer: UploadTransformer = {
  slug: 'poster',
  mimeTypes: ['video/mp4'],
  transformVariant: () => Promise.resolve({ status: 'skip' }),
}

const posterOwner: PlannedHookOwner = {
  options: undefined,
  owner: { slug: 'poster', mimeTypes: ['video/mp4'], variantNames: ['thumbnail'] },
  transformer: posterTransformer as PlannedHookOwner['transformer'],
}

const getStages = ({
  bridgeTransformer,
  hookOwners = [posterOwner],
  pipeline = [],
}: Partial<Pick<UploadStages, 'bridgeTransformer' | 'hookOwners' | 'pipeline'>> = {}) => ({
  bridgeTransformer,
  hookOwners,
  pipeline,
})

const createCollection = ({ mimeTypes }: { mimeTypes?: string[] } = {}) =>
  ({
    slug: 'media',
    upload: { disableLocalStorage: true, ...(mimeTypes && { mimeTypes }) },
  }) as unknown as SanitizedCollectionConfig

/** A request whose upload handler serves `stored` with HTTP Range. */
const createReq = ({ stored }: { stored: Buffer }) => {
  const handler = vi.fn(async (req: PayloadRequest) => {
    const info = getRangeRequestInfo({
      fileSize: stored.length,
      rangeHeader: req.headers.get('range'),
    })

    if (info.type === 'invalid') {
      return new Response(null, { headers: info.headers, status: info.status })
    }

    const body =
      info.type === 'partial' ? stored.subarray(info.rangeStart, info.rangeEnd + 1) : stored

    return new Response(body, { headers: info.headers, status: info.status })
  })
  const req = {
    context: {},
    headers: new Headers(),
    payload: {
      collections: { media: { config: { upload: { handlers: [handler] } } } },
      logger: { error: vi.fn(), warn: vi.fn() },
    },
  } as unknown as PayloadRequest

  return { handler, req }
}

const getRangeHeaders = (handler: ReturnType<typeof createReq>['handler']) =>
  handler.mock.calls.map(([req]) => req.headers.get('range'))

describe('shouldReadClientUploadByRanges', () => {
  const collection = createCollection()

  it('should read by ranges when only a hook owner reads a header-only client upload', () => {
    expect(
      shouldReadClientUploadByRanges({ collection, file: probedClientUpload, stages: getStages() }),
    ).toBe(true)
  })

  it('should read by ranges when the collection checks the MIME type of a video', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection: createCollection({ mimeTypes: ['video/*'] }),
        file: probedClientUpload,
        stages: getStages({ hookOwners: [] }),
      }),
    ).toBe(true)
  })

  it('should not read by ranges when nothing reads the upload and no MIME types are set', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: probedClientUpload,
        stages: getStages({ hookOwners: [] }),
      }),
    ).toBe(false)
  })

  it('should not read by ranges when a main-file stage also runs', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: probedClientUpload,
        stages: getStages({ pipeline: [posterTransformer] }),
      }),
    ).toBe(false)
  })

  it('should not read by ranges when the upload bridge is planned', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: probedClientUpload,
        stages: getStages({ bridgeTransformer: posterTransformer }),
      }),
    ).toBe(false)
  })

  it('should not read by ranges when the upload has its whole contents', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: { ...probedClientUpload, data: Buffer.alloc(1000) },
        stages: getStages(),
      }),
    ).toBe(false)
  })

  it('should not read by ranges without an upload reference', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: { ...probedClientUpload, uploadReference: undefined },
        stages: getStages(),
      }),
    ).toBe(false)
  })

  it('should not read by ranges for a staged upload', () => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: { ...probedClientUpload, uploadReference: { uploadId: '1' } },
        stages: getStages(),
      }),
    ).toBe(false)
  })

  it.for([
    { name: 'an image', file: { mimetype: 'image/png', name: 'photo.png' } },
    { name: 'a PDF', file: { mimetype: 'application/pdf', name: 'document.pdf' } },
    { name: 'an SVG named as a video', file: { mimetype: 'video/mp4', name: 'clip.svg' } },
  ])('should not read by ranges for $name', ({ file }) => {
    expect(
      shouldReadClientUploadByRanges({
        collection,
        file: { ...probedClientUpload, ...file },
        stages: getStages(),
      }),
    ).toBe(false)
  })
})

describe('hasDeferredContentChecks', () => {
  it('should defer the checks of a header-only video in a collection with MIME types', () => {
    expect(
      hasDeferredContentChecks({
        collection: createCollection({ mimeTypes: ['video/*'] }),
        file: probedClientUpload,
      }),
    ).toBe(true)
  })

  it('should not defer the checks in a collection without MIME types', () => {
    expect(
      hasDeferredContentChecks({ collection: createCollection(), file: probedClientUpload }),
    ).toBe(false)
  })

  it('should not defer the checks of a video with its whole contents', () => {
    expect(
      hasDeferredContentChecks({
        collection: createCollection({ mimeTypes: ['video/*'] }),
        file: { ...probedClientUpload, data: Buffer.alloc(1000) },
      }),
    ).toBe(false)
  })
})

describe('getCheckedClientUploadSource', () => {
  const getSource = ({
    collection = createCollection(),
    stored,
  }: {
    collection?: SanitizedCollectionConfig
    stored: Buffer
  }) => {
    const { handler, req } = createReq({ stored })
    const source = getCheckedClientUploadSource({
      collection,
      file: { ...probedClientUpload, size: stored.length },
      req,
    })

    return { handler, source }
  }

  it('should return a ranged source for a valid MP4', async () => {
    const { handler, source } = getSource({ stored: MINIMAL_MP4 })

    expect(await source).toMatchObject({ mimeType: 'video/mp4', sizeInBytes: MINIMAL_MP4.length })
    expect(getRangeHeaders(handler)).not.toContain(null)
  })

  it('should check a video against the collection MIME types over ranges', async () => {
    const { handler, source } = getSource({
      collection: createCollection({ mimeTypes: ['video/*'] }),
      stored: MINIMAL_MP4,
    })

    expect(await source).toMatchObject({ sizeInBytes: MINIMAL_MP4.length })
    expect(getRangeHeaders(handler)).not.toContain(null)
  })

  it('should reject a video that the collection MIME types do not allow', async () => {
    const { source } = getSource({
      collection: createCollection({ mimeTypes: ['video/webm'] }),
      stored: MINIMAL_MP4,
    })

    await expect(source).rejects.toMatchObject({
      data: { errors: [{ message: 'Invalid MIME type: video/mp4.', path: 'file' }] },
    })
  })

  it('should reject an MP4 whose boxes do not fill the file', async () => {
    const { source } = getSource({
      stored: Buffer.concat([MINIMAL_MP4.subarray(0, 24), Buffer.alloc(64, 0xff)]),
    })

    await expect(source).rejects.toBeInstanceOf(ValidationError)
    await expect(source).rejects.toMatchObject({
      data: { errors: [{ message: 'Invalid or corrupted ISO base media file.', path: 'file' }] },
    })
  })

  it('should reject an MP4 whose boxes do not fill the file in a collection with MIME types', async () => {
    const { source } = getSource({
      collection: createCollection({ mimeTypes: ['video/*'] }),
      stored: Buffer.concat([MINIMAL_MP4.subarray(0, 24), Buffer.alloc(64, 0xff)]),
    })

    await expect(source).rejects.toMatchObject({
      data: { errors: [{ message: 'Invalid or corrupted ISO base media file.', path: 'file' }] },
    })
  })

  it('should return no source when the bytes are another type than the upload claims', async () => {
    const { source } = getSource({ stored: PNG_SIGNATURE })

    expect(await source).toBeUndefined()
  })

  it('should return no source when the box check needs too many reads', async () => {
    // A fragmented MP4 can have many top-level boxes. Each one is a storage request.
    const freeBoxes = Array.from({ length: 200 }, () => {
      const box = Buffer.alloc(8)
      box.writeUInt32BE(8)
      box.write('free', 4, 'latin1')
      return box
    })
    const { source } = getSource({
      stored: Buffer.concat([MINIMAL_MP4.subarray(0, 24), ...freeBoxes]),
    })

    expect(await source).toBeUndefined()
  })
})
