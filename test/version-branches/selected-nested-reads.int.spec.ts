/* eslint-disable payload/no-relative-monorepo-imports -- Trusted nested reads must retain native point and selection. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { createBranchReadIntent } from '../../packages/payload/src/versions/branches/operations/branchReadContext.js'
import { createSelectedBranchRequest } from '../../packages/payload/src/versions/branches/operations/selectedBranchContext.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import {
  articlesSlug,
  ordinarySettingsSlug,
  queryDocsSlug,
  scalarArticlesSlug,
  secondaryUsersSlug,
  settingsSlug,
} from './slugs.js'

const cleanups: (() => void)[] = []

test.suite(
  'Authoritative explicit nested reads',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test.afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup()
      }
    })

    test('should give nested collection and global operations fresh policies at one native point', async ({
      payload,
    }) => {
      const { staging, scalar } = await prepare({ payload })
      const settings = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const ordinary = payload.globals.config.find(({ slug }) => slug === ordinarySettingsSlug)!
      const collection = payload.collections[scalarArticlesSlug]!.config
      const previousGlobal = settings.access.read
      const previousOrdinary = ordinary.access.read
      const previousCollection = collection.access.read
      const points: unknown[] = []
      const calls: string[] = []
      settings.access.read = async ({ req, slug }) => {
        calls.push(`global:${slug}`)
        points.push(req.transactionID)
        expect(
          (
            await req.payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              req,
              depth: 0,
            })
          ).title,
        ).toBe('Selected collection')
        expect(
          (await req.payload.findGlobal({ slug: ordinarySettingsSlug, req, depth: 0 })).title,
        ).toBe('Ordinary global')
        return true
      }
      collection.access.read = ({ req }) => {
        calls.push('collection')
        points.push(req.transactionID)
        return true
      }
      ordinary.access.read = ({ req }) => {
        calls.push('ordinary')
        points.push(req.transactionID)
        return true
      }
      cleanups.push(() => {
        settings.access.read = previousGlobal
        ordinary.access.read = previousOrdinary
        collection.access.read = previousCollection
      })
      expect((await payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 })).title).toBe(
        'Selected global',
      )
      expect(calls).toEqual([`global:${settingsSlug}`, 'collection', 'ordinary'])
      expect(new Set(points).size).toBe(1)
    })

    test('should read a selected global from a collection access callback without reusing its grant', async ({
      payload,
    }) => {
      const { staging, scalar } = await prepare({ payload })
      const config = payload.collections[scalarArticlesSlug]!.config
      const global = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      const previousGlobal = global.access.read
      let globals = 0
      global.access.read = () => {
        globals++
        return true
      }
      config.access.read = async ({ req }) => {
        expect((await req.payload.findGlobal({ slug: settingsSlug, req, depth: 0 })).title).toBe(
          'Selected global',
        )
        return { id: { equals: scalar.id } }
      }
      cleanups.push(() => {
        config.access.read = previous
        global.access.read = previousGlobal
      })
      expect(
        (
          await payload.findByID({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req: staging,
            depth: 0,
          })
        ).title,
      ).toBe('Selected collection')
      expect(globals).toBe(1)
    })

    test('should derive explicit locale and branch overrides without changing the outer request', async ({
      payload,
    }) => {
      const { staging, scalar, article } = await prepare({ payload })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      config.access.read = async ({ req }) => {
        expect(req.locale).toBe('en')
        expect(req.fallbackLocale).toBe(false)
        const french = await req.payload.findByID({
          collection: articlesSlug,
          id: article.id,
          req,
          locale: 'fr',
          fallbackLocale: false,
          context: { childOnly: true },
          depth: 0,
        })
        expect(french.title).toBe('French selected')
        const main = createBranchReadIntent({ branchID: 'main', req })
        expect(
          (
            await req.payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              req: main,
              depth: 0,
            })
          ).title,
        ).toBe('Live collection')
        expect(
          (
            await req.payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              req,
              depth: 0,
            })
          ).title,
        ).toBe('Selected collection')
        expect(req.locale).toBe('en')
        expect(req.context.childOnly).toBeUndefined()
        return true
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      expect((await payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 })).title).toBe(
        'Selected global',
      )
      expect(staging.locale).toBe('en')
      expect(staging.fallbackLocale).toBe(false)
      expect(staging.transactionID).toBeUndefined()
    })

    for (const shouldThrow of [false, true]) {
      test(`should revoke captured raw and Local API methods after ${shouldThrow ? 'failure' : 'success'} while preserving the source request`, async ({
        payload,
      }) => {
        const { staging, scalar, source } = await prepare({ payload })
        const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
        const previous = config.access.read
        let captured!: PayloadRequest
        let read!: Payload['findGlobal']
        let raw!: NonNullable<
          NonNullable<Payload['db']['branching']>['queryProjection']
        >['findGlobal']
        config.access.read = ({ req }) => {
          captured = req
          read = req.payload.findGlobal
          raw = req.payload.db.branching!.queryProjection!.findGlobal
          if (shouldThrow) {
            throw new Error('Expected callback failure')
          }
          return true
        }
        cleanups.push(() => {
          config.access.read = previous
        })
        const action = payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 })
        const outcome = await action.then(
          () => 'success',
          (error: Error) => error.message,
        )
        expect(outcome).toBe(shouldThrow ? 'Expected callback failure' : 'success')
        expect(() => read({ slug: settingsSlug, req: captured, depth: 0 })).toThrow('snapshot')
        expect(() =>
          raw!({
            slug: settingsSlug,
            req: captured,
            context: { branchKey: 'main', relationAccess: {} },
          }),
        ).toThrow('snapshot')
        expect(source.transactionID).toBeUndefined()
        expect(source.locale).toBe('en')
        expect(source.fallbackLocale).toBe(false)
        await payload.update({
          collection: scalarArticlesSlug,
          id: scalar.id,
          req: source,
          draft: true,
          data: { title: 'Source still writable' },
          depth: 0,
        })
        expect(
          (
            await payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              draft: true,
              depth: 0,
            })
          ).title,
        ).toBe('Source still writable')
      })
    }

    test.options(
      'should retain one observed native point across a committed concurrent branch edit without replaying callbacks',
      { db: (adapter) => !adapter.startsWith('sqlite') },
      async ({ payload }) => {
        const { staging, scalar } = await prepare({ payload })
        const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
        const previous = config.access.read
        let calls = 0
        config.access.read = async ({ req }) => {
          calls++
          expect(
            (
              await req.payload.findByID({
                collection: scalarArticlesSlug,
                id: scalar.id,
                req,
                depth: 0,
              })
            ).title,
          ).toBe('Selected collection')
          await payload.update({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req: staging,
            depth: 0,
            data: { title: 'Concurrent committed edit' },
          })
          expect(
            (
              await req.payload.findByID({
                collection: scalarArticlesSlug,
                id: scalar.id,
                req,
                depth: 0,
              })
            ).title,
          ).toBe('Selected collection')
          return true
        }
        try {
          expect(
            (await payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 })).title,
          ).toBe('Selected global')
          expect(calls).toBe(1)
          expect(
            (
              await payload.findByID({
                collection: scalarArticlesSlug,
                id: scalar.id,
                req: staging,
                depth: 0,
              })
            ).title,
          ).toBe('Concurrent committed edit')
        } finally {
          config.access.read = previous
        }
      },
    )

    test('should reauthorize same native id across genuine auth collections before nested operation hooks', async ({
      payload,
    }) => {
      const { staging, scalar } = await prepare({ payload })
      const primaryCollection = payload.config.admin.user
      const primary = await payload.create({
        collection: primaryCollection,
        overrideAccess: true,
        data: { email: 'b2-primary@example.com', password: 'test' },
      })
      const secondary = await payload.db.create({
        collection: secondaryUsersSlug,
        data: { id: primary.id, email: 'b2-secondary@example.com' },
      })
      expect(secondary.id).toBe(primary.id)
      const primaryUser = { ...primary, collection: primaryCollection } as PayloadRequest['user']
      const secondaryUser = {
        ...secondary,
        collection: secondaryUsersSlug,
      } as PayloadRequest['user']
      const global = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const collection = payload.collections[scalarArticlesSlug]!.config
      const previousGlobal = global.access.read
      const previousRead = collection.access.read
      const previousBefore = collection.hooks.beforeOperation
      const decisions: unknown[] = []
      const hookContexts: unknown[] = []
      collection.access.read = ({ req }) => {
        decisions.push([req.user?.collection, req.user?.id])
        return req.user?.collection === primaryCollection
      }
      collection.hooks.beforeOperation = [
        ...previousBefore,
        async ({ args, operation, req }) => {
          if (operation === 'read' && req.context.childNamespace) {
            const nested = await req.payload.findGlobal({
              slug: ordinarySettingsSlug,
              req,
              locale: 'en',
              depth: 0,
            })
            hookContexts.push([req.user?.collection, req.locale, nested.title])
          }
          return args
        },
      ]
      global.access.read = async ({ req }) => {
        expect(req.user?.collection).toBe(primaryCollection)
        expect(
          await req.payload.findByID({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req,
            user: secondaryUser,
            locale: 'fr',
            context: { childNamespace: true },
            depth: 0,
            disableErrors: true,
          }),
        ).toBeNull()
        expect(
          (
            await req.payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              req,
              user: primaryUser,
              depth: 0,
            })
          ).title,
        ).toBe('Selected collection')
        expect(req.user?.collection).toBe(primaryCollection)
        expect(req.locale).toBe('en')
        return true
      }
      cleanups.push(() => {
        global.access.read = previousGlobal
        collection.access.read = previousRead
        collection.hooks.beforeOperation = previousBefore
      })
      expect(
        (
          await payload.findGlobal({
            slug: settingsSlug,
            req: staging,
            user: primaryUser,
            depth: 0,
          })
        ).title,
      ).toBe('Selected global')
      expect(hookContexts).toEqual([[secondaryUsersSlug, 'fr', 'Ordinary global']])
      expect(decisions).toEqual([
        [secondaryUsersSlug, primary.id],
        [primaryCollection, primary.id],
      ])
      expect(staging.user).toBeNull()
    })

    test('should preserve caller transaction ownership and nested read-own-writes through rollback', async ({
      payload,
    }) => {
      const { scalar } = await prepare({ payload })
      const transactionID = await payload.db.beginTransaction()
      if (transactionID == null) {
        throw new Error('Native transaction required')
      }
      const source = await createPayloadRequest({
        payload,
        locale: 'en',
        fallbackLocale: false,
        context: { callerMarker: true },
      })
      source.transactionID = transactionID
      const loader = source.payloadDataLoader
      const selected = createSelectedBranchRequest({ branchID: 'staging', req: source })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      try {
        await payload.update({
          collection: scalarArticlesSlug,
          id: scalar.id,
          req: selected,
          depth: 0,
          data: { title: 'Caller uncommitted' },
        })
        config.access.read = async ({ req }) => {
          expect(
            (
              await req.payload.findByID({
                collection: scalarArticlesSlug,
                id: scalar.id,
                req,
                depth: 0,
              })
            ).title,
          ).toBe('Caller uncommitted')
          return true
        }
        expect(
          (await payload.findGlobal({ slug: settingsSlug, req: selected, depth: 0 })).title,
        ).toBe('Selected global')
        expect(source.transactionID).toBe(transactionID)
        expect(selected.transactionID).toBe(transactionID)
        expect(source.payloadDataLoader).toBe(loader)
        expect(source.context).toEqual({ callerMarker: true })
      } finally {
        config.access.read = previous
        await payload.db.rollbackTransaction(transactionID)
      }
      const fresh = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      expect(
        (
          await payload.findByID({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req: fresh,
            depth: 0,
          })
        ).title,
      ).toBe('Selected collection')
    })

    test('should preserve caller auth data when a raw callback mutates its user and fails binding validation', async ({
      payload,
    }) => {
      const { source, staging, scalar } = await prepare({ payload })
      const user = await payload.create({
        collection: payload.config.admin.user,
        overrideAccess: true,
        data: { email: 'b2-mutation@example.com', password: 'test' },
      })
      source.user = { ...user, collection: payload.config.admin.user } as PayloadRequest['user']
      const before = structuredClone(source.user)
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      config.access.read = ({ req }) => {
        ;(req.user as unknown as { email: string }).email = 'changed@example.com'
        return true
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      await expect(
        payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 }),
      ).rejects.toThrow('binding changed')
      expect(source.user).toEqual(before)
      expect(source.fallbackLocale).toBe(false)
      expect(source.transactionID).toBeUndefined()
      expect(
        (
          await payload.findByID({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req: staging,
            depth: 0,
          })
        ).title,
      ).toBe('Selected collection')
    })

    test('should refuse unregistered copies, context spoofing and mutations from a raw callback', async ({
      payload,
    }) => {
      const { staging, scalar } = await prepare({ payload })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      config.access.read = async ({ req }) => {
        for (const copy of [
          { ...req },
          Object.create(req),
          { payload: req.payload, context: { selectedBranch: 'staging' } },
        ]) {
          await expect(
            payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              req: copy,
              depth: 0,
            }),
          ).rejects.toThrow('copied')
        }
        await expect(
          payload.update({
            collection: scalarArticlesSlug,
            id: scalar.id,
            req,
            data: { title: 'Forbidden' },
            depth: 0,
          }),
        ).rejects.toThrow('raw branch read')
        return true
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      expect((await payload.findGlobal({ slug: settingsSlug, req: staging, depth: 0 })).title).toBe(
        'Selected global',
      )
    })
  },
)

const prepare = async ({ payload }: { payload: Payload }) => {
  for (const collection of [articlesSlug, queryDocsSlug, scalarArticlesSlug]) {
    await activateEmpty({ payload, collection })
  }
  await activateEmpty({ payload, global: settingsSlug })
  const scalar = await payload.create({
    collection: scalarArticlesSlug,
    data: { title: 'Live collection', _status: 'published' },
    depth: 0,
  })
  const article = await payload.create({
    collection: articlesSlug,
    data: { title: 'English live', _status: 'published' },
    depth: 0,
  })
  await payload.update({
    collection: articlesSlug,
    id: article.id,
    locale: 'fr',
    data: { title: 'French live', _status: 'published' },
    depth: 0,
  })
  await payload.updateGlobal({
    slug: settingsSlug,
    data: { title: 'Live global', _status: 'published' },
    depth: 0,
  })
  await payload.updateGlobal({
    slug: ordinarySettingsSlug,
    data: { title: 'Ordinary global' },
    depth: 0,
  })
  const source = await createPayloadRequest({ payload, locale: 'en', fallbackLocale: false })
  const staging = createSelectedBranchRequest({ branchID: 'staging', req: source })
  await payload.update({
    collection: scalarArticlesSlug,
    id: scalar.id,
    data: { title: 'Selected collection' },
    req: staging,
    depth: 0,
  })
  await payload.update({
    collection: articlesSlug,
    id: article.id,
    locale: 'fr',
    data: { title: 'French selected' },
    req: staging,
    depth: 0,
  })
  await payload.updateGlobal({
    slug: settingsSlug,
    data: { title: 'Selected global' },
    req: staging,
    depth: 0,
  })
  return { staging, scalar, article, source }
}
const activateEmpty = async ({
  collection,
  global,
  payload,
}: {
  collection?: string
  global?: string
  payload: Payload
}) => {
  const config = collection
    ? payload.collections[collection]!.config
    : payload.globals.config.find(({ slug }) => slug === global)!
  await payload.db.create({
    collection: config.custom.branchStorage.cutover,
    data: {
      singleton: 'authoritative',
      schemaGeneration: 1,
      migrationID: 'b2-nested',
      generation: 1,
      isActivated: true,
    },
  })
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) {
    throw new Error('Native transaction required')
  }
  req.transactionID = transactionID
  try {
    for (const branchID of ['main', 'drafts', 'staging']) {
      await bootstrapBranchProjectionPage({
        branchID,
        collection: config.custom.branchStorage.heads,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
