import type { PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import type { UploadFeatureServerProps } from './index.js'

import { coerceUploadIDs } from './coerceUploadIDs.js'

const buildReq = ({ idType }: { idType: 'number' | 'text' }) =>
  ({
    payload: {
      collections: { media: {} },
      db: { defaultIDType: idType },
    },
  }) as unknown as PayloadRequest

const coerce = ({ idType, value }: { idType: 'number' | 'text'; value: unknown }) => {
  const hook = coerceUploadIDs({
    enabledCollectionSlugs: ['media'],
  } as unknown as UploadFeatureServerProps)

  const editorState = {
    root: { children: [{ type: 'upload', relationTo: 'media', value }] },
  }

  const result = hook({ req: buildReq({ idType }), value: editorState } as never) as typeof editorState

  return result.root.children[0]!.value
}

describe('coerceUploadIDs', () => {
  it.each([
    ['1', 1],
    ['0', 0],
    ['42', 42],
    ['-1', -1],
    ['-42', -42],
  ])('coerces %j to the number %d for numeric ID collections', (value, expected) => {
    expect(coerce({ idType: 'number', value })).toBe(expected)
  })

  it.each(['-0', '01', '1.5', '1e3', ' 1', 'abc', '', '9007199254740993', '-9007199254740993'])(
    'leaves %j unchanged',
    (value) => {
      expect(coerce({ idType: 'number', value })).toBe(value)
    },
  )

  it('leaves string IDs unchanged for text ID collections', () => {
    expect(coerce({ idType: 'text', value: '123' })).toBe('123')
  })
})
