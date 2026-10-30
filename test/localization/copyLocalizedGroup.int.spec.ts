import type { User } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { LocalizedWithinLocalized } from './payload-types.js'

import { devUser } from '../credentials.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { copyDataFromLocaleHandler } from '../../packages/ui/src/utilities/copyDataFromLocale.js'
import { test } from '../__helpers/int/vitest.js'

test.suite(
  'Localization — copy array inside a localized group',
  { config: './config.ts', resetBetweenTests: false },
  () => {
    let user: User

    test.beforeAll(async ({ payloadInstance: payload }) => {
      user = (
        await payload.find({
          collection: 'users',
          overrideAccess: true,
          where: {
            email: {
              equals: devUser.email,
            },
          },
        })
      ).docs[0] as unknown as User

      user['collection'] = 'users'
    })

    test('assigns new row ids and leaves the source locale unchanged', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'localized-within-localized',
        data: {
          myGroup: {
            rows: [
              {
                text: 'section',
                children: [
                  {
                    text: 'link',
                  },
                ],
              },
            ],
          },
        },
        locale: 'en',
        overrideAccess: true,
      })

      const sourceRowID = doc.myGroup?.rows?.[0]?.id
      const sourceChildID = doc.myGroup?.rows?.[0]?.children?.[0]?.id

      const req = await createPayloadRequest({ payload, user })

      const copied = (await copyDataFromLocaleHandler({
        collectionSlug: 'localized-within-localized',
        docID: doc.id,
        fromLocale: 'en',
        overrideData: true,
        req,
        toLocale: 'es',
      })) as LocalizedWithinLocalized

      expect(copied.myGroup?.rows?.[0]?.text).toBe('section')
      expect(copied.myGroup?.rows?.[0]?.children?.[0]?.text).toBe('link')
      expect(copied.myGroup?.rows?.[0]?.id).toBeTruthy()
      expect(copied.myGroup?.rows?.[0]?.id).not.toBe(sourceRowID)
      expect(copied.myGroup?.rows?.[0]?.children?.[0]?.id).toBeTruthy()
      expect(copied.myGroup?.rows?.[0]?.children?.[0]?.id).not.toBe(sourceChildID)

      const source = await payload.findByID({
        id: doc.id,
        collection: 'localized-within-localized',
        fallbackLocale: false,
        locale: 'en',
        overrideAccess: true,
      })

      expect(source.myGroup?.rows?.[0]?.id).toBe(sourceRowID)
      expect(source.myGroup?.rows?.[0]?.text).toBe('section')
      expect(source.myGroup?.rows?.[0]?.children?.[0]?.id).toBe(sourceChildID)
    })
  },
)
