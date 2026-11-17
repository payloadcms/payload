import type { FileData, Payload } from 'payload'

import { readdir, readFile, rm } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the same inherited policy wrapper used during config sanitization.
import { createInheritedReadVersionsAccess } from '../../packages/payload/src/collections/config/defaults.js'
import { test } from '../__helpers/int/vitest.js'
import { versionedCloudFiles } from '../plugin-cloud-storage/versionedCloudStorage.js'
import { sourceReadCalls } from './collections/DynamicMedia.js'
import {
  versionedCloudMediaSlug,
  versionedDynamicMediaDir,
  versionedDynamicMediaSlug,
} from './shared.js'
import { requestCropCalls, signedImagePlans } from './transformers.js'

const imageFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads/image.png',
)
const savedCrop = { height: 600, width: 800, x: 100, y: 200 }
const currentCrop = { height: 100, width: 200, x: 0, y: 0 }

test.suite('Historical request-time files', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    requestCropCalls.length = 0
    signedImagePlans.length = 0
    sourceReadCalls.length = 0
    versionedCloudFiles.clear()
    await rm(versionedDynamicMediaDir, { force: true, recursive: true })
  })

  test('should render the historical main file without changing its saved state or files', async ({
    payload,
    restClient,
  }) => {
    const { bytes, selected } = await replaceImage({ payload })
    const filesBefore = (await readdir(versionedDynamicMediaDir)).sort()
    const collection = payload.collections[versionedDynamicMediaSlug].config
    const originalRead = collection.access.read
    const checkedModes: boolean[] = []
    let response: Response

    try {
      collection.access.read = (args) => {
        checkedModes.push(Boolean(args.req.fileTransform))
        return originalRead(args)
      }
      response = await restClient.GET(
        `/${versionedDynamicMediaSlug}/file/${selected.version.filename}?version=${selected.id}`,
        { auth: false },
      )
    } finally {
      collection.access.read = originalRead
    }

    expect(checkedModes.length).toBeGreaterThan(0)
    expect(checkedModes).not.toContain(true)
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      await sharp(bytes)
        .extract({
          left: savedCrop.x,
          top: savedCrop.y,
          width: savedCrop.width,
          height: savedCrop.height,
        })
        .png()
        .toBuffer(),
    )
    expect(requestCropCalls).toEqual([
      { crop: savedCrop, purpose: 'persisted-default', variantName: undefined },
    ])
    expect((await readdir(versionedDynamicMediaDir)).sort()).toEqual(filesBefore)
    expect(await readVersion({ id: selected.id, payload })).toEqual(selected)
  })

  test('should serve version API URLs when the main file and original share a filename', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: versionedDynamicMediaSlug,
      data: { _status: 'published', _transforms: { crop: savedCrop } },
      file: { name: 'shared.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const { docs } = await payload.findVersions({
      collection: versionedDynamicMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const version = docs[0]!.version

    expect(version.filename).toBe(version.original!.filename)
    expect(version.url).toContain('version=')
    expect(version.original!.url).toContain('original=true')

    for (const entry of [version, version.original!]) {
      const url = new URL(entry.url!, 'http://localhost')

      url.searchParams.set('prefix', '')
      if (entry === version.original) {
        url.searchParams.set('w', '50')
      }

      const response = await restClient.GET(`/${url.pathname.replace(/^\/api\//, '')}${url.search}`)

      expect(response.status).toBe(200)
      expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
        height: entry === version ? 600 : 1600,
        width: entry === version ? 800 : 1600,
      })
    }

    expect(requestCropCalls).toHaveLength(1)
  })

  test('should apply request params to an old request-time version', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${selected.version.filename}?version=${selected.id}&w=200`,
    )

    expect(response.status).toBe(200)
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      height: 150,
      width: 200,
    })
    expect(requestCropCalls).toEqual([
      { crop: savedCrop, purpose: 'persisted-default', variantName: undefined },
      { crop: savedCrop, purpose: 'request-override', variantName: undefined },
    ])
  })

  test('should deny request params on an old version without transform access', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${selected.version.variants!.card!.filename}?version=${selected.id}&w=200&q=70`,
      { auth: false, headers: { 'x-test-sign-image': 'true' }, redirect: 'manual' },
    )

    expect(response.status).toBe(403)
    expect(signedImagePlans).toHaveLength(0)
    expect(sourceReadCalls).toHaveLength(0)
  })

  for (const policy of ['read', 'readVersions'] as const) {
    test(`should apply ${policy} constraints in the requested locale before transforming a historical file`, async ({
      payload,
      restClient,
    }) => {
      const { selected } = await replaceImage({ payload })
      const collection = payload.collections[versionedDynamicMediaSlug].config
      const originalAccess = collection.access[policy]

      if (policy === 'read') {
        await payload.update({
          id: selected.parent,
          collection: versionedDynamicMediaSlug,
          data: { alt: 'visible' },
          locale: 'en',
        })
        await payload.update({
          id: selected.parent,
          collection: versionedDynamicMediaSlug,
          data: { alt: 'hidden' },
          locale: 'es',
        })
      } else {
        await payload.db.updateVersion({
          id: selected.id,
          collection: versionedDynamicMediaSlug,
          versionData: { version: { ...selected.version, alt: { en: 'visible', es: 'hidden' } } },
        })
      }

      try {
        collection.access[policy] = () => ({
          [policy === 'read' ? 'alt' : 'version.alt']: { equals: 'visible' },
        })
        const url =
          `/${versionedDynamicMediaSlug}/file/${selected.version.filename}?version=${selected.id}` as const

        expect((await restClient.GET(`${url}&locale=es`)).status).toBe(403)
        expect(requestCropCalls).toHaveLength(0)
        expect(sourceReadCalls).toHaveLength(0)

        const response = await restClient.GET(`${url}&locale=en`)

        expect(response.status).toBe(200)
        await response.arrayBuffer()
        expect(requestCropCalls).toHaveLength(1)
        expect(sourceReadCalls.length).toBeGreaterThan(0)
      } finally {
        collection.access[policy] = originalAccess
      }
    })
  }

  test('should pass the parent ID to inherited version access and enforce its saved-field constraint', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })
    const collection = payload.collections[versionedDynamicMediaSlug].config
    const originalReadVersions = collection.access.readVersions
    const seenIDs: (number | string | undefined)[] = []

    try {
      collection.access.readVersions = createInheritedReadVersionsAccess(({ id }) => {
        seenIDs.push(id)
        return { alt: { equals: 'current' } }
      })

      const response = await restClient.GET(
        `/${versionedDynamicMediaSlug}/file/${selected.version.filename}?version=${selected.id}`,
      )

      expect(response.status).toBe(403)
      expect(seenIDs).toEqual([selected.parent])
      expect(requestCropCalls).toHaveLength(0)
      expect(sourceReadCalls).toHaveLength(0)
    } finally {
      collection.access.readVersions = originalReadVersions
    }
  })

  test('should deny a trashed version before executing its request transformer', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })

    await payload.db.updateVersion({
      id: selected.id,
      collection: versionedDynamicMediaSlug,
      versionData: { version: { ...selected.version, deletedAt: new Date().toISOString() } },
    })

    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${selected.version.filename}?version=${selected.id}`,
    )

    expect(response.status).toBe(404)
    expect(requestCropCalls).toHaveLength(0)
    expect(sourceReadCalls).toHaveLength(0)
  })

  test('should not let transform-only access read a historical file, with or without request parameters', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })
    const collection = payload.collections[versionedDynamicMediaSlug].config
    const originalRead = collection.access.read
    const url =
      `/${versionedDynamicMediaSlug}/file/${selected.version.variants!.card!.filename}?version=${selected.id}` as const

    try {
      collection.access.read = ({ req }) => Boolean(req.fileTransform)

      expect((await restClient.GET(url)).status).toBe(403)
      expect((await restClient.GET(`${url}&w=200`)).status).toBe(403)
      expect(requestCropCalls).toHaveLength(0)
      expect(sourceReadCalls).toHaveLength(0)
    } finally {
      collection.access.read = originalRead
    }
  })

  test('should use historical cloud storage identity and reject another prefix', async ({
    payload,
    restClient,
  }) => {
    const { bytes, selected } = await replaceImage({ collection: versionedCloudMediaSlug, payload })
    const filename = selected.version.variants!.card!.filename
    const url = `/${versionedCloudMediaSlug}/file/${filename}?version=${selected.id}` as const

    expect((await restClient.GET(`${url}&prefix=wrong`)).status).toBe(404)

    const response = await restClient.GET(`${url}&prefix=tenant`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      await sharp(bytes)
        .extract({
          left: savedCrop.x,
          top: savedCrop.y,
          width: savedCrop.width,
          height: savedCrop.height,
        })
        .resize({ width: 400 })
        .png()
        .toBuffer(),
    )
  })

  test('should reject a historical size removed from the current configuration before reading its original', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await replaceImage({ payload })
    const upload = payload.collections[versionedDynamicMediaSlug].config.upload
    const variants = upload.variants

    try {
      upload.variants = []

      const response = await restClient.GET(
        `/${versionedDynamicMediaSlug}/file/${selected.version.variants!.card!.filename}?version=${selected.id}`,
      )

      expect(response.status).toBe(500)
      expect(requestCropCalls).toHaveLength(0)
      expect(sourceReadCalls).toHaveLength(0)
    } finally {
      upload.variants = variants
    }
  })
})

async function replaceImage({
  collection = versionedDynamicMediaSlug,
  payload,
}: {
  collection?: typeof versionedCloudMediaSlug | typeof versionedDynamicMediaSlug
  payload: Payload
}) {
  const bytes = await readFile(imageFixture)
  const created = await payload.create({
    collection,
    data: {
      _status: 'published',
      _transforms: { crop: savedCrop },
      alt: 'historical',
      ...(collection === versionedCloudMediaSlug ? { prefix: 'tenant' } : {}),
    },
    file: { name: 'historical.png', data: bytes, mimetype: 'image/png', size: bytes.length },
  })
  const { docs } = await payload.db.findVersions({
    collection,
    limit: 1,
    where: { parent: { equals: created.id } },
  })
  const selectedID = docs[0]!.id
  const nextBytes = await sharp(bytes).flop().png().toBuffer()

  await payload.update({
    id: created.id,
    collection,
    data: {
      _status: 'published',
      _transforms: { crop: currentCrop },
      alt: 'current',
      ...(collection === versionedCloudMediaSlug ? { prefix: 'current-tenant' } : {}),
    },
    file: { name: 'current.png', data: nextBytes, mimetype: 'image/png', size: nextBytes.length },
  })
  requestCropCalls.length = 0
  sourceReadCalls.length = 0

  return { bytes, created, selected: await readVersion({ collection, id: selectedID, payload }) }
}

async function readVersion({
  collection = versionedDynamicMediaSlug,
  id,
  payload,
}: {
  collection?: typeof versionedCloudMediaSlug | typeof versionedDynamicMediaSlug
  id: number | string
  payload: Payload
}) {
  const { docs } = await payload.db.findVersions<
    { alt?: Record<string, string> | string } & FileData
  >({
    collection,
    limit: 1,
    where: { id: { equals: id } },
  })

  return docs[0]!
}
