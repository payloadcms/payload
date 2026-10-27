import type { Payload } from 'payload'

import path from 'path'

import { createPayloadRequest } from 'payload'

import { fileURLToPath } from 'url'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { branchChangesSlug, branchesSlug, mediaSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

const filename = fileURLToPath(import.meta.url)

const dirname = path.dirname(filename)

test.suite('Branching: uploads-merge', { config: './config.ts', resetBetweenTests: false }, () => {
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

    test('should remove the superseded main file when merging a branch upload replacement', async () => {
      const fs = await import('fs')
      const media = await createOnMain('remove-original-on-merge.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const replacementData = Buffer.from('merged branch replacement bytes')
      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'merged replacement' },
        file: {
          name: 'merged-branch-replacement.txt',
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

      expect(replaced.filename).toContain('uploadwork')

      await payload.branches.merge({ branch: 'uploadwork' })

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(fs.existsSync(mainFilePath)).toBe(false)
      expect(fs.existsSync(replacementFilePath)).toBe(true)
      expect(onMain.filename).toBe(replaced.filename)
    })

    test('should ignore unrelated upload edits when merging a branch upload replacement', async () => {
      const fs = await import('fs')
      const mainFileData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
      const media = await payload.create({
        collection: mediaSlug,
        data: { alt: 'main image' },
        file: {
          name: 'merge-query-main.png',
          data: mainFileData,
          mimetype: 'image/png',
          size: mainFileData.length,
        },
      })
      const replacementData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.jpg'))
      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch image' },
        file: {
          name: 'merge-query-branch.jpg',
          data: replacementData,
          mimetype: 'image/jpeg',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)
      const expectedReplacementData = fs.readFileSync(replacementFilePath)
      const req = await createPayloadRequest({ payload })
      const uploadEdits = {
        crop: { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 },
        heightInPixels: 20,
        widthInPixels: 20,
      }

      cleanup.push(media.id)
      req.query = { unrelated: 'preserve me', uploadEdits }

      await payload.branches.merge({ branch: 'uploadwork', req })

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onMain.filename).toBe(replaced.filename)
      expect(fs.readFileSync(replacementFilePath)).toEqual(expectedReplacementData)
      expect(req.query.unrelated).toBe('preserve me')
      expect(req.query.uploadEdits).toBe(uploadEdits)
    })
  })
})
