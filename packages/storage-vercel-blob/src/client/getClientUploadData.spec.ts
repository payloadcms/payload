import { describe, expect, it } from 'vitest'

import { getClientUploadData } from './getClientUploadData.js'

describe('getClientUploadData', () => {
  it('should use the collection prefix when docPrefix is empty in non-composite mode', () => {
    const result = getClientUploadData({
      collectionPrefix: 'collection-prefix',
      filename: 'image.png',
    })

    expect(result).toEqual({
      pathname: 'collection-prefix/image.png',
      prefix: '',
    })
  })

  it('should use the docPrefix when provided in non-composite mode', () => {
    const result = getClientUploadData({
      collectionPrefix: 'collection-prefix',
      docPrefix: 'document-prefix',
      filename: 'image.png',
    })

    expect(result).toEqual({
      pathname: 'document-prefix/image.png',
      prefix: 'document-prefix',
    })
  })

  it('should combine collection and document prefixes in composite mode', () => {
    const result = getClientUploadData({
      collectionPrefix: 'collection-prefix',
      docPrefix: 'document-prefix',
      filename: 'image.png',
      useCompositePrefixes: true,
    })

    expect(result).toEqual({
      pathname: 'collection-prefix/document-prefix/image.png',
      prefix: 'document-prefix',
    })
  })

  it('should sanitize prefixes and the filename', () => {
    const result = getClientUploadData({
      collectionPrefix: '../collection',
      docPrefix: './document',
      filename: '../../unsafe.png',
      useCompositePrefixes: true,
    })

    expect(result).toEqual({
      pathname: 'collection/document/unsafe.png',
      prefix: 'document',
    })
  })
})
