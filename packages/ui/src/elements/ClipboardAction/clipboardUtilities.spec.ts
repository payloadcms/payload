import type { ClientBlock, ClientField } from 'payload'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClipboardPasteData } from './types.js'

import { canPasteClipboardData } from './clipboardUtilities.js'

const localStorageClipboardKey = '_payloadClipboard'

const textField = { name: 'text', type: 'text' } as ClientField
const numberField = { name: 'num', type: 'number' } as ClientField

const ctaBlock = { slug: 'cta', fields: [textField] } as ClientBlock
const otherBlock = { slug: 'other', fields: [numberField] } as ClientBlock

const arrayClipboard: ClipboardPasteData = {
  type: 'array',
  data: { 'items.0.text': { valid: true, value: 'hi' } },
  fields: [textField],
  path: 'items',
  rowIndex: 0,
}

const blocksClipboard: ClipboardPasteData = {
  type: 'blocks',
  blocks: [ctaBlock],
  data: { 'layout.0.blockType': { valid: true, value: 'cta' } },
  path: 'layout',
  rowIndex: 0,
}

class LocalStorageMock {
  private store: Record<string, string> = {}

  clear() {
    this.store = {}
  }

  getItem(key: string): null | string {
    return key in this.store ? this.store[key] : null
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value)
  }
}

describe('canPasteClipboardData', () => {
  let localStorageMock: LocalStorageMock

  beforeEach(() => {
    localStorageMock = new LocalStorageMock()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const writeClipboard = (data: ClipboardPasteData) => {
    localStorageMock.setItem(localStorageClipboardKey, JSON.stringify(data))
  }

  it('should return false when the clipboard is empty', () => {
    expect(canPasteClipboardData({ path: 'items', schemaFields: [textField] })).toBe(false)
  })

  it('should return false when the clipboard contains invalid JSON', () => {
    localStorageMock.setItem(localStorageClipboardKey, 'not-json')

    expect(canPasteClipboardData({ path: 'items', schemaFields: [textField] })).toBe(false)
  })

  it('should return true for an array field with a matching schema', () => {
    writeClipboard(arrayClipboard)

    expect(canPasteClipboardData({ path: 'items', schemaFields: [textField] })).toBe(true)
  })

  it('should return false for an array field with an incompatible schema', () => {
    writeClipboard(arrayClipboard)

    expect(canPasteClipboardData({ path: 'items', schemaFields: [numberField] })).toBe(false)
  })

  it('should return true for a blocks field with a matching schema', () => {
    writeClipboard(blocksClipboard)

    expect(canPasteClipboardData({ path: 'layout', schemaBlocks: [ctaBlock] })).toBe(true)
  })

  it('should return false for a blocks field with an incompatible schema', () => {
    writeClipboard(blocksClipboard)

    expect(canPasteClipboardData({ path: 'layout', schemaBlocks: [otherBlock] })).toBe(false)
  })

  it('should return false when pasting array data into a blocks field', () => {
    writeClipboard(arrayClipboard)

    expect(canPasteClipboardData({ path: 'layout', schemaBlocks: [ctaBlock] })).toBe(false)
  })
})
