import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  branchChangesSlug,
  branchesSlug,
  excludedSlug,
  mediaSlug,
  numericIDSlug,
  postsSlug,
  uniqueSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

const fieldNames = (collection: SanitizedCollectionConfig): string[] =>
  collection.flattenedFields.map((field) => field.name)

const collectionConfig = (slug: string): SanitizedCollectionConfig =>
  payload.collections[slug]!.config

test.suite('Branching: schema', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Schema', () => {
    test('should inject branch fields into a branch-enabled collection', () => {
      const names = fieldNames(collectionConfig(postsSlug))

      expect(names).toContain('_branch')
      expect(names).toContain('_branchDocID')
      expect(names).not.toContain('_branchOp')
    })

    test('should enforce one collection change per branch and logical document', () => {
      const changesCollection = collectionConfig(branchChangesSlug)

      expect(fieldNames(changesCollection)).toContain('documentID')
      expect(changesCollection.indexes).toContainEqual({
        fields: ['branch', 'collectionSlug', 'documentID'],
        requireExists: ['collectionSlug', 'documentID'],
        unique: true,
      })
    })

    test('should reject a duplicate collection change identity', async () => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Unique collection change identity' },
        overrideAccess: true,
      })
      const document = await payload.create({
        collection: postsSlug,
        data: { title: 'unique change target' },
        overrideAccess: true,
      })
      const changeData = {
        branch: branch.slug,
        collectionSlug: postsSlug,
        doc: { relationTo: postsSlug, value: document.id },
        documentID: String(document.id),
        entityType: 'collection' as const,
        operation: 'update' as const,
      }
      const change = await payload.create({
        collection: branchChangesSlug,
        data: changeData,
        overrideAccess: true,
      })

      try {
        await expect(
          payload.create({
            collection: branchChangesSlug,
            data: changeData,
            overrideAccess: true,
          }),
        ).rejects.toThrow()
      } finally {
        await payload.delete({
          id: change.id,
          collection: branchChangesSlug,
          overrideAccess: true,
        })
        await payload.delete({ id: document.id, collection: postsSlug, overrideAccess: true })
        await payload.delete({ id: branch.id, collection: branchesSlug, overrideAccess: true })
      }
    })

    test('should not inject branch fields into a collection opted out with branching: false', () => {
      const names = fieldNames(collectionConfig(excludedSlug))

      expect(names).not.toContain('_branch')
      expect(names).not.toContain('_branchDocID')
      expect(names).not.toContain('_branchOp')
    })

    test('should not inject branch fields into auth collections by default', () => {
      const names = fieldNames(collectionConfig('users'))

      expect(names).not.toContain('_branch')
    })

    test('should not inject branch fields into built-in Payload collections by default', () => {
      const names = fieldNames(collectionConfig('payload-preferences'))

      expect(names).not.toContain('_branch')
    })

    test('should default _branch to the main sentinel rather than null', () => {
      const branchField = collectionConfig(postsSlug).flattenedFields.find(
        (field) => field.name === '_branch',
      )

      expect(branchField).toMatchObject({ type: 'text', defaultValue: 'main' })
    })

    test('should type _branchDocID as a self-referential relationship so it inherits the ID type', () => {
      const docIDField = collectionConfig(numericIDSlug).flattenedFields.find(
        (field) => field.name === '_branchDocID',
      )

      expect(docIDField).toMatchObject({ type: 'relationship', relationTo: numericIDSlug })
    })

    test('should rewrite a unique field into a branch-scoped compound index', () => {
      const config = collectionConfig(uniqueSlug)
      const slugField = config.flattenedFields.find((field) => field.name === 'slug')

      expect(slugField).toMatchObject({ unique: false })
      expect(config.sanitizedIndexes).toContainEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ path: 'slug' }),
            expect.objectContaining({ path: '_branch' }),
          ]),
          unique: true,
        }),
      )
      expect(config.indexes).toContainEqual({
        fields: ['site', 'customSlug', '_branch'],
        requireExists: ['site', 'customSlug'],
        unique: true,
      })
      expect(config.sanitizedIndexes).toContainEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ path: 'metadata.code' }),
            expect.objectContaining({ path: '_branch' }),
          ]),
          requireExists: [
            { localizedPath: 'metadata.code', path: 'metadata.code', pathHasLocalized: false },
          ],
          unique: true,
        }),
      )
    })

    test('should add branch scope to a custom upload filename index', () => {
      expect(collectionConfig(mediaSlug).upload.filenameCompoundIndex).toEqual([
        'filename',
        'alt',
        '_branch',
      ])
    })

    test.options(
      'should build one branch-scoped unique index for each localized value',
      { db: 'mongo' },
      () => {
        const indexes = (payload.db as MongooseAdapter).collections[
          uniqueSlug
        ].schema.indexes() as [Record<string, 1>, Record<string, unknown>][]

        expect(indexes).toContainEqual([
          { _branch: 1, 'localizedSlug.en': 1 },
          {
            partialFilterExpression: { 'localizedSlug.en': { $exists: true } },
            unique: true,
          },
        ])
        expect(indexes).toContainEqual([
          { _branch: 1, 'localizedSlug.es': 1 },
          {
            partialFilterExpression: { 'localizedSlug.es': { $exists: true } },
            unique: true,
          },
        ])
        expect(
          indexes.some(
            ([definition]) => 'localizedSlug.en' in definition && 'localizedSlug.es' in definition,
          ),
        ).toBe(false)
      },
    )
  })
})
