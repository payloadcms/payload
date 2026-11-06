import { describe, expect, it } from 'vitest'

import { hasDraggedFiles } from './hasDraggedFiles.js'

describe('preview file drag detection', () => {
  it.each([
    { types: ['Files'] },
    { types: ['application/x-moz-file'] },
    { items: [{ kind: 'file' }] },
    { files: { length: 1 } },
  ])('should recognize files before file contents are available %j', (dataTransfer) => {
    expect(hasDraggedFiles({ dataTransfer })).toBe(true)
  })

  it.each([
    null,
    {},
    { types: ['text/plain', 'text/uri-list'], items: [{ kind: 'string' }], files: { length: 0 } },
  ])('should ignore non-file drags %j', (dataTransfer) => {
    expect(hasDraggedFiles({ dataTransfer })).toBe(false)
  })
})
