import type { PayloadRequest } from '../types/index.js'
import type { BaseDatabaseAdapter, CopyArgs } from './types.js'

import { describe, expect, it } from 'vitest'

import { createDatabaseAdapter } from './createDatabaseAdapter.js'
import { defaultCopy } from './defaultCopy.js'

const createCopyArgs = ({ req }: { req: PayloadRequest }): CopyArgs => ({
  collection: 'posts',
  data: {
    _branch: 'caller-branch-must-not-win',
    settings: { heading: 'replacement heading' },
    title: 'replacement title',
  },
  destination: { branch: 'feature' },
  req,
  source: { branch: 'main', id: 'main-id' },
})

const payloadForCopy = {
  collections: {
    posts: {
      config: {
        fields: [
          {
            name: 'items',
            type: 'array',
            fields: [
              { name: 'label', type: 'text' },
              { name: 'id', type: 'text' },
            ],
          },
        ],
      },
    },
  },
  config: {},
}

describe('defaultCopy', () => {
  it('should register on adapters that do not provide a copy implementation', () => {
    const adapter = createDatabaseAdapter({} as BaseDatabaseAdapter)

    expect(adapter.copy).toBe(defaultCopy)
  })

  it('should copy an exact source into the destination with replacement values', async () => {
    const source = {
      _branch: 'main',
      _branchDocID: null,
      id: 'source-row-id',
      items: [{ id: 'source-child-id', label: 'text child' }, { label: 'child without id' }],
      settings: { heading: 'source heading', summary: 'source summary' },
      title: 'source title',
    }
    let createArgs: Parameters<BaseDatabaseAdapter['create']>[0] | undefined
    let findOneArgs: Parameters<BaseDatabaseAdapter['findOne']>[0] | undefined
    const destination = { id: 'destination-row-id', title: 'replacement title' }
    const req = { payload: {} } as PayloadRequest
    const adapter = {
      create: async (args: Parameters<BaseDatabaseAdapter['create']>[0]) => {
        createArgs = args

        return destination
      },
      findOne: async (args: Parameters<BaseDatabaseAdapter['findOne']>[0]) => {
        findOneArgs = args

        return source
      },
      payload: payloadForCopy,
    } as BaseDatabaseAdapter

    const result = await defaultCopy.call(adapter, createCopyArgs({ req }))

    expect(result).toBe(destination)
    expect(findOneArgs).toEqual({
      branch: false,
      collection: 'posts',
      req,
      where: {
        and: [
          { _branch: { equals: 'main' } },
          {
            or: [{ id: { equals: 'main-id' } }, { _branchDocID: { equals: 'main-id' } }],
          },
        ],
      },
    })
    expect(createArgs).toEqual({
      collection: 'posts',
      data: {
        _branch: 'feature',
        _branchDocID: 'main-id',
        items: [
          { id: expect.not.stringMatching('source-child-id'), label: 'text child' },
          { id: expect.any(String), label: 'child without id' },
        ],
        settings: { heading: 'replacement heading' },
        title: 'replacement title',
      },
      req,
    })
  })
})
