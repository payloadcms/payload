import type { Payload } from 'payload'

import path from 'path'

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

test.suite(
  'Branching: uploads-discard',
  { config: './config.ts', resetBetweenTests: false },
  () => {
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

      test('should remove a replacement file when discarding a branch upload edit', async () => {
        const fs = await import('fs')
        const media = await createOnMain('keep-original-on-discard.txt')
        const mainFilePath = path.resolve(dirname, 'media', media.filename)
        const replacementData = Buffer.from('discarded branch replacement bytes')
        const replaced = await payload.update({
          id: media.id,
          branch: 'uploadwork',
          collection: mediaSlug,
          data: { alt: 'discarded replacement' },
          file: {
            name: 'discarded-branch-replacement.txt',
            data: replacementData,
            mimetype: 'text/plain',
            size: replacementData.length,
          },
        })
        const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

        expect(replaced.filename).toContain('uploadwork')

        await payload.branches.discard({ branch: 'uploadwork' })

        const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

        expect(fs.existsSync(mainFilePath)).toBe(true)
        expect(fs.existsSync(replacementFilePath)).toBe(false)
        expect(onMain.filename).toBe(media.filename)
      })
    })
  },
)
