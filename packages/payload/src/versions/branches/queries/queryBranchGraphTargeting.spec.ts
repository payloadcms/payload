import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import * as branchProjectionCodec from './branchProjectionCodec.js'

import { encodeBranchProjectionID } from './branchProjectionCodec.js'
import { queryBranchContent } from './queryBranchContent.js'

vi.mock('./withBranchReadSnapshot.js', () => ({
  captureBranchReadProjectionGuards: () => [],
  withBranchReadSnapshot: ({ read, req }) => read({ req }),
}))
vi.mock('./compileBranchProjectionWhere.js', () => ({
  collectBranchQueryLocales: () => [],
  compileBranchProjectionSort: () => [],
  compileBranchProjectionWhere: ({ where }) => where,
}))

const setup = ({ kind = 'number', hasCustomID = true, adapterName = 'mongoose' } = {}) => {
  const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 })
  const source = {
    slug: 'source',
    access: { read: () => true },
    custom: { branchQueryStorage: { projection: 'projection' } },
    fields: hasCustomID ? [{ name: 'id', type: kind }] : [],
    flattenedFields: [],
  }
  const projection = {
    slug: 'projection',
    custom: { branchProjectionStorage: { collection: 'source' } },
    fields: [
      { name: '_branchProjection', type: 'group', fields: [{ name: 'logicalID', type: kind }] },
    ],
  }
  const req = {
    payload: {
      config: { blocks: [], localization: false },
      collections: { source: { config: source }, projection: { config: projection } },
      db: { name: adapterName, defaultIDType: kind, branching: { queryProjection: { find } } },
    },
  } as unknown as PayloadRequest

  return { find, projection, req, source }
}

describe('private raw graph batch targeting', () => {
  it.each([
    { kind: 'number', ids: [0, -0, 1.5] },
    { kind: 'text', ids: ['0', '1.5', '界💡'.repeat(1300)] },
  ])(
    'should encode typed $kind references without forwarding a private native argument',
    async ({ kind, ids }) => {
      const { find, req } = setup({ kind })
      const where = { id: { in: ids } }

      await queryBranchContent({
        branchID: 'staging',
        collection: 'source',
        graphTargetIDs: ids,
        req,
        where,
      })

      expect(find.mock.calls[0]![0]).toMatchObject({
        context: {
          graphTarget: {
            collection: 'projection',
            ids: ids.map((logicalID) =>
              encodeBranchProjectionID({ branchID: 'staging', logicalID }),
            ),
          },
        },
        where,
      })
      expect(find.mock.calls[0]![0]).not.toHaveProperty('graphTargetIDs')
    },
  )

  it('should use the adapter identity kind when a source has no custom ID', async () => {
    const { find, req } = setup({ kind: 'text', hasCustomID: false })

    await queryBranchContent({ branchID: 0, collection: 'source', graphTargetIDs: ['1'], req })

    expect(find.mock.calls[0]![0].context.graphTarget.ids).toEqual([
      encodeBranchProjectionID({ branchID: 0, logicalID: '1' }),
    ])
  })

  it.each([
    { name: 'omitted hints', ids: undefined },
    { name: 'empty hints', ids: [] },
    { name: 'oversized hints', ids: Array.from({ length: 51 }, (_, id) => id) },
    { name: 'numeric strings', ids: ['1'] },
    { name: 'mixed types', ids: [1, '1'] },
    { name: 'nonfinite numbers', ids: [Infinity] },
  ])('should retain the full logical query for $name', async ({ ids }) => {
    const { find, req } = setup()
    const where = { id: { in: [1, 2] } }

    await queryBranchContent({
      branchID: 'staging',
      collection: 'source',
      graphTargetIDs: ids,
      req,
      where,
    })

    expect(find.mock.calls[0]![0].context.graphTarget).toBeUndefined()
    expect(find.mock.calls[0]![0].where).toEqual(where)
    expect(find.mock.calls[0]![0]).not.toHaveProperty('graphTargetIDs')
  })

  it.each(['ordinary', 'global', 'projection-global', 'mismatched-source', 'mismatched-type'])(
    'should skip %s collection mappings',
    async (mode) => {
      const { find, projection, req, source } = setup()
      if (mode === 'ordinary') delete source.custom.branchQueryStorage
      if (mode === 'global') source.custom.branchQueryGlobalSource = 'settings'
      if (mode === 'projection-global')
        projection.custom.branchProjectionStorage.global = 'settings'
      if (mode === 'mismatched-source')
        projection.custom.branchProjectionStorage.collection = 'other'
      if (mode === 'mismatched-type') projection.fields[0]!.fields[0]!.type = 'text'

      await queryBranchContent({
        branchID: 'staging',
        collection: 'source',
        graphTargetIDs: [1],
        req,
      })

      expect(find.mock.calls[0]![0].context.graphTarget).toBeUndefined()
    },
  )

  it.each(['postgres', 'sqlite', 'd1-sqlite'])(
    'should preserve the logical graph batch without encoding unused %s target IDs',
    async (adapterName) => {
      const { find, req } = setup({ adapterName })
      const where = { id: { in: [0, 1.5] } }
      const encode = vi.spyOn(branchProjectionCodec, 'encodeBranchProjectionID')
      try {
        await queryBranchContent({
          branchID: 'staging',
          collection: 'source',
          graphTargetIDs: [0, 1.5],
          req,
          where,
        })

        expect(encode).not.toHaveBeenCalled()
        expect(find.mock.calls[0]![0].where).toEqual(where)
        expect(find.mock.calls[0]![0].context.graphTarget).toBeUndefined()
        expect(find.mock.calls[0]![0]).not.toHaveProperty('graphTargetIDs')
      } finally {
        encode.mockRestore()
      }
    },
  )
})
