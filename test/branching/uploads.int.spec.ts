import type { Payload } from 'payload'

import path from 'path'

import { commitTransaction, createPayloadRequest } from 'payload'

import { fileURLToPath } from 'url'

import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { databaseAdapterSupportsTransactions } from '../__helpers/shared/databaseAdapterCapabilities.js'

import { mongooseList } from '../__helpers/shared/isMongoose.js'

import { devUser } from '../credentials.js'

import { branchChangesSlug, branchesSlug, mediaSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

type UploadFileDocument = {
  filename?: null | string
  original?: { filename?: null | string } | null
  variants?: null | Record<string, { filename?: null | string } | null>
}

const filename = fileURLToPath(import.meta.url)

const dirname = path.dirname(filename)

const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

const getUploadRepresentationFilenames = (doc: unknown): Record<string, string> => {
  const upload = doc as UploadFileDocument
  const filenames: Record<string, string> = {}

  if (typeof upload.filename === 'string') {
    filenames.default = upload.filename
  }
  if (typeof upload.original?.filename === 'string') {
    filenames.original = upload.original.filename
  }
  for (const [name, variant] of Object.entries(upload.variants ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (typeof variant?.filename === 'string') {
      filenames[`variant:${name}`] = variant.filename
    }
  }

  return filenames
}

test.suite('Branching: uploads', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = createTrustedPayload(payloadInstance)
    restClient = restClientInstance

    const login = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())

    token = login.token
  })

  test.describe('Uploads on a branch', () => {
    const cleanup: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'uploadwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Upload work', slug: 'uploadwork' },
        })
      }
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: mediaSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: mediaSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: mediaSlug }).catch(() => {})
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'uploadwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    const createOnMain = async (name: string) => {
      const data = Buffer.from(`bytes for ${name}`)
      const doc = await payload.create({
        collection: mediaSlug,
        data: { alt: 'on main' },
        file: {
          name,
          data,
          mimetype: 'text/plain',
          size: data.length,
        },
      })
      cleanup.push(doc.id)

      return doc
    }

    // `filename` is unique on upload collections, and it is added after branch
    // field injection runs — so it kept a global unique index and a branch's copy
    // of the row collided with main's, failing validation outright.
    test('should allow forking an upload onto a branch despite the unique filename', async () => {
      const fs = await import('fs')
      const media = await createOnMain('fork-me.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const mainFileData = fs.readFileSync(mainFilePath)

      await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'on branch' },
      })

      const onBranch = await payload.findByID({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
      })
      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })
      const branchFilePath = path.resolve(dirname, 'media', onBranch.filename)

      expect(onBranch.alt).toBe('on branch')
      expect(onBranch.filename).not.toBe(media.filename)
      expect(onBranch.filename).toContain('uploadwork')
      expect(fs.readFileSync(branchFilePath)).toEqual(mainFileData)
      expect(onMain.alt).toBe('on main')
      expect(onMain.filename).toBe(media.filename)
      expect(fs.readFileSync(mainFilePath)).toEqual(mainFileData)
    })

    test('should avoid filename collisions when copying an upload onto a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('legacy-source.txt')
      const legacyFilename = 'legacy-uploadwork.txt'
      const generatedFilePath = path.resolve(dirname, 'media', media.filename)
      const mainFilePath = path.resolve(dirname, 'media', legacyFilename)

      fs.renameSync(generatedFilePath, mainFilePath)
      await payload.db.updateOne({
        branch: false,
        collection: mediaSlug,
        data: {
          filename: legacyFilename,
          original: { filename: null, filesize: null, mimeType: null, url: null },
          url: media.url!.replace(encodeURIComponent(media.filename!), legacyFilename),
          variants: {},
        },
        where: { id: { equals: media.id } },
      })

      const mainFileData = fs.readFileSync(mainFilePath)

      await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'copied without a collision' },
      })

      const onBranch = await payload.findByID({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
      })
      const branchFilePath = path.resolve(dirname, 'media', onBranch.filename)

      expect(onBranch.filename).not.toBe(legacyFilename)
      expect(onBranch.filename).toContain('uploadwork')
      expect(fs.readFileSync(branchFilePath)).toEqual(mainFileData)
      expect(fs.readFileSync(mainFilePath)).toEqual(mainFileData)
    })

    test('should copy every image file when metadata first changes on a branch', async () => {
      const fs = await import('fs')
      const sourceData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
      const media = await payload.create({
        collection: mediaSlug,
        data: { alt: 'main image' },
        file: {
          name: 'metadata-copy.png',
          data: sourceData,
          mimetype: 'image/png',
          size: sourceData.length,
        },
      })

      cleanup.push(media.id)

      await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch metadata edit' },
      })

      const [onBranch, onMain] = await Promise.all([
        payload.findByID({ id: media.id, branch: 'uploadwork', collection: mediaSlug }),
        payload.findByID({ id: media.id, collection: mediaSlug }),
      ])
      const mainFiles = getUploadRepresentationFilenames(onMain)
      const branchFiles = getUploadRepresentationFilenames(onBranch)

      expect(Object.keys(branchFiles)).toEqual(Object.keys(mainFiles))

      for (const [role, mainFilename] of Object.entries(mainFiles)) {
        const branchFilename = branchFiles[role]!

        expect(branchFilename).not.toBe(mainFilename)
        expect(branchFilename).toContain('uploadwork')
        expect(fs.readFileSync(path.resolve(dirname, 'media', branchFilename))).toEqual(
          fs.readFileSync(path.resolve(dirname, 'media', mainFilename)),
        )
      }
    })

    // `deleteAssociatedFiles` ran before `db.deleteOne` decided the delete was a
    // tombstone, so main lost the file its surviving row still points at.
    test('should keep the file on main when deleting an upload on a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-me.txt')
      const filePath = path.resolve(dirname, 'media', media.filename)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(true)

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onMain.alt).toBe('on main')
    })

    test('should keep the main file when replacing an upload on a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-original-on-replace.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const replacementData = Buffer.from('branch replacement bytes')

      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch replacement' },
        file: {
          name: 'branch-replacement.txt',
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)
      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(replaced.filename).toContain('uploadwork')
      expect(fs.existsSync(mainFilePath)).toBe(true)
      expect(fs.existsSync(replacementFilePath)).toBe(true)
      expect(fs.readFileSync(mainFilePath, 'utf8')).toBe('bytes for keep-original-on-replace.txt')
      expect(fs.readFileSync(replacementFilePath, 'utf8')).toBe('branch replacement bytes')
      expect(onMain.filename).toBe(media.filename)
    })

    test('should isolate an explicit same-name branch upload from the main file', async () => {
      const fs = await import('fs')
      const media = await createOnMain('same-name-branch-replacement.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const mainFileData = fs.readFileSync(mainFilePath)
      const replacementData = Buffer.from('same-name branch replacement bytes')

      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'same-name branch replacement' },
        file: {
          name: media.filename,
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
        overwriteExistingFiles: true,
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

      expect(replaced.filename).not.toBe(media.filename)
      expect(replaced.filename).toContain('uploadwork')
      expect(fs.readFileSync(mainFilePath)).toEqual(mainFileData)
      expect(fs.readFileSync(replacementFilePath)).toEqual(replacementData)
    })

    test('should isolate branch image reprocessing from the main file', async () => {
      const fs = await import('fs')
      const sourceData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
      const media = await payload.create({
        collection: mediaSlug,
        data: { alt: 'main image before branch crop' },
        file: {
          name: 'branch-crop-source.png',
          data: sourceData,
          mimetype: 'image/png',
          size: sourceData.length,
        },
      })
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const mainFileData = fs.readFileSync(mainFilePath)
      const req = await createPayloadRequest({ payload })

      cleanup.push(media.id)
      req.query = {
        uploadEdits: {
          crop: { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 },
          heightInPixels: 20,
          widthInPixels: 20,
        },
      }

      const cropped = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch crop' },
        req,
      })
      const croppedFilePath = path.resolve(dirname, 'media', cropped.filename)

      expect(cropped.filename).not.toBe(media.filename)
      expect(cropped.filename).toContain('uploadwork')
      expect(fs.readFileSync(mainFilePath)).toEqual(mainFileData)
      expect(fs.existsSync(croppedFilePath)).toBe(true)
    })

    test('should store every image file when creating media on a branch', async () => {
      const fs = await import('fs')
      const sourceData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
      const created = await payload.create({
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch image' },
        file: {
          name: 'branch-image.png',
          data: sourceData,
          mimetype: 'image/png',
          size: sourceData.length,
        },
      })
      const branchFiles = getUploadRepresentationFilenames(created)

      expect(Object.keys(branchFiles)).toEqual([
        'default',
        'original',
        'variant:large',
        'variant:medium',
        'variant:thumbnail',
      ])
      expect(new URL(created.url!, 'http://localhost').searchParams.get('branch')).toBe(
        'uploadwork',
      )

      for (const branchFilename of Object.values(branchFiles)) {
        expect(branchFilename).toContain('uploadwork')
        expect(
          fs.readFileSync(path.resolve(dirname, 'media', branchFilename)).length,
        ).toBeGreaterThan(0)
      }

      const [branchFileResponse, mainFileResponse] = await Promise.all([
        restClient.GET(`/${mediaSlug}/file/${created.filename}?branch=uploadwork`),
        restClient.GET(`/${mediaSlug}/file/${created.filename}`),
      ])

      expect(branchFileResponse.status).toBe(200)
      expect(mainFileResponse.status).toBe(404)
    })

    test.options(
      'should preserve a temp-file upload across a transient final commit retry',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        const fs = await import('fs/promises')
        const os = await import('os')
        const media = await createOnMain('temp-retry-main.txt')
        const replacementData = Buffer.from('temp-file retry replacement bytes')
        const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-temp-retry-'))
        const tempFilePath = path.join(temporaryDirectory, 'replacement.txt')
        const previousUseTempFiles = payload.config.upload.useTempFiles
        const commitTransaction = payload.db.commitTransaction.bind(payload.db)
        const commitError = Object.assign(new Error('Simulated first final commit conflict'), {
          errorLabels: ['TransientTransactionError'],
        })
        let commitAttempts = 0

        await fs.writeFile(tempFilePath, replacementData)
        payload.config.upload.useTempFiles = true

        const commitSpy = vi
          .spyOn(payload.db, 'commitTransaction')
          .mockImplementation(async (transactionID) => {
            commitAttempts += 1

            if (commitAttempts === 1) {
              throw commitError
            }

            return commitTransaction(transactionID)
          })

        try {
          const replaced = await payload.update({
            id: media.id,
            branch: 'uploadwork',
            collection: mediaSlug,
            data: { alt: 'temp-file branch replacement' },
            file: {
              name: 'temp-retry-replacement.txt',
              data: Buffer.alloc(0),
              mimetype: 'text/plain',
              size: replacementData.length,
              tempFilePath,
            },
          })
          const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

          expect(commitAttempts).toBe(2)
          expect(await fs.readFile(replacementFilePath)).toEqual(replacementData)
          await expect(fs.access(tempFilePath)).rejects.toMatchObject({ code: 'ENOENT' })
        } finally {
          commitSpy.mockRestore()
          payload.config.upload.useTempFiles = previousUseTempFiles
          await fs.rm(temporaryDirectory, { force: true, recursive: true })
        }
      },
    )

    test.options(
      'should remove a branch upload when its final database commit fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        const fs = await import('fs/promises')
        const media = await createOnMain('upload-rollback-main.txt')
        const originalFilePath = path.resolve(dirname, 'media', media.filename)
        const replacementFilePath = path.resolve(
          dirname,
          'media',
          'upload-rollback-failed-uploadwork-original.txt',
        )
        const replacementData = Buffer.from('upload that must be rolled back')
        const commitError = new Error('Simulated final commit failure')
        let commitAttempts = 0
        const commitSpy = vi.spyOn(payload.db, 'commitTransaction').mockImplementation(() => {
          commitAttempts += 1
          throw commitError
        })

        try {
          await expect(
            payload.update({
              id: media.id,
              branch: 'uploadwork',
              collection: mediaSlug,
              data: { alt: 'failed branch replacement' },
              file: {
                name: 'upload-rollback-failed.txt',
                data: replacementData,
                mimetype: 'text/plain',
                size: replacementData.length,
              },
            }),
          ).rejects.toBe(commitError)
        } finally {
          commitSpy.mockRestore()
        }

        expect(commitAttempts).toBe(1)
        expect(await fs.readFile(originalFilePath, 'utf8')).toBe(
          'bytes for upload-rollback-main.txt',
        )
        await expect(fs.access(replacementFilePath)).rejects.toMatchObject({ code: 'ENOENT' })
      },
    )

    test('should hide an upload deleted on a branch from that branch only', async () => {
      const media = await createOnMain('hide-me.txt')

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      const onBranch = await payload.find({
        branch: 'uploadwork',
        collection: mediaSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: mediaSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(media.id))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(media.id))
    })

    test('should delete the file when removing an upload created on that branch', async () => {
      const fs = await import('fs')

      const created = await payload.create({
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch only' },
        file: {
          name: 'branch-only.txt',
          data: Buffer.from('branch only bytes'),
          mimetype: 'text/plain',
          size: 17,
        },
      })

      const filePath = path.resolve(dirname, 'media', created.filename)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: created.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(false)
    })
  })
})
