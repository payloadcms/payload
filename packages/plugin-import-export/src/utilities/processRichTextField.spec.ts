import { describe, expect, it } from 'vitest'

import { processRichTextField } from './processRichTextField.js'

// Minimal helpers to keep assertions readable
const asRecord = (v: unknown) => v as Record<string, unknown>
const asArray = (v: unknown) => v as unknown[]

// ─── Fixtures ────────────────────────────────────────────────────────────────

const textNode = (overrides: Record<string, unknown> = {}) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  text: 'Hello',
  type: 'text',
  version: 1,
  ...overrides,
})

const paragraphNode = (children: unknown[] = [textNode()]) => ({
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
})

const lexicalDoc = (children: unknown[] = [paragraphNode()]) => ({
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'root',
  version: 1,
})

// ─── Primitive pass-through ──────────────────────────────────────────────────

describe('processRichTextField — primitive pass-through', () => {
  it('should return null unchanged', () => {
    expect(processRichTextField(null)).toBeNull()
  })

  it('should return undefined unchanged', () => {
    expect(processRichTextField(undefined)).toBeUndefined()
  })

  it('should return a number unchanged', () => {
    expect(processRichTextField(42)).toBe(42)
  })

  it('should return false unchanged', () => {
    expect(processRichTextField(false)).toBe(false)
  })
})

// ─── String input (the recovered-from-missed-hook path) ─────────────────────

describe('processRichTextField — JSON string input', () => {
  it('should parse a valid JSON string into an object', () => {
    const doc = lexicalDoc()
    expect(processRichTextField(JSON.stringify(doc))).toEqual(doc)
  })

  it('should return an unparseable string unchanged', () => {
    expect(processRichTextField('not json')).toBe('not json')
  })

  it('should return an empty string unchanged', () => {
    expect(processRichTextField('')).toBe('')
  })

  it('should parse a string and still convert numeric string properties', () => {
    const node = { type: 'text', detail: '0', format: '3', indent: '0', version: '1', text: 'hi' }
    const result = asRecord(processRichTextField(JSON.stringify(node)))
    expect(result.detail).toBe(0)
    expect(result.format).toBe(3)
    expect(result.indent).toBe(0)
    expect(result.version).toBe(1)
  })
})

// ─── Numeric property coercion ───────────────────────────────────────────────

describe('processRichTextField — numeric property coercion', () => {
  it('should convert detail, format, indent, version from strings to numbers', () => {
    const input = textNode({ detail: '0', format: '0', indent: '0', version: '1' })
    const result = asRecord(processRichTextField(input))
    expect(result.detail).toBe(0)
    expect(result.format).toBe(0)
    expect(result.indent).toBe(0)
    expect(result.version).toBe(1)
  })

  it('should convert start and value from strings to numbers (list/listitem nodes)', () => {
    const listItemNode = { type: 'listitem', start: '1', value: '2', version: '1' }
    const result = asRecord(processRichTextField(listItemNode))
    expect(result.start).toBe(1)
    expect(result.value).toBe(2)
  })

  it('should convert textFormat and textStyle from strings to numbers', () => {
    const input = { type: 'text', textFormat: '4', textStyle: '0', version: '1', text: 'x' }
    const result = asRecord(processRichTextField(input))
    expect(result.textFormat).toBe(4)
    expect(result.textStyle).toBe(0)
  })

  it('should leave a non-numeric string in a numeric-property slot unchanged', () => {
    // Lexical paragraph format can be "" (empty) or alignment strings
    const input = paragraphNode()
    const result = asRecord(processRichTextField(input))
    expect(result.format).toBe('')
  })

  it('should leave already-numeric values unchanged', () => {
    const input = textNode({ detail: 0, format: 3, version: 1 })
    const result = asRecord(processRichTextField(input))
    expect(result.detail).toBe(0)
    expect(result.format).toBe(3)
    expect(result.version).toBe(1)
  })

  it('should not convert boolean values on numeric-property keys', () => {
    const input = { type: 'custom', format: true, version: '1' }
    const result = asRecord(processRichTextField(input))
    expect(result.format).toBe(true)
    expect(result.version).toBe(1)
  })
})

// ─── Recursive children processing ──────────────────────────────────────────

describe('processRichTextField — recursive children', () => {
  it('should recursively convert numeric strings inside children arrays', () => {
    const input = paragraphNode([textNode({ detail: '0', format: '0', version: '1' })])
    const result = asRecord(processRichTextField(input))
    const child = asRecord(asArray(result.children)[0])
    expect(child.detail).toBe(0)
    expect(child.format).toBe(0)
    expect(child.version).toBe(1)
  })

  it('should handle three levels of nesting (root → paragraph → text)', () => {
    const input = lexicalDoc([paragraphNode([textNode({ version: '1', format: '2' })])])
    const result = asRecord(processRichTextField(input))
    const paragraph = asRecord(asArray(result.children)[0])
    const text = asRecord(asArray(paragraph.children)[0])
    expect(text.version).toBe(1)
    expect(text.format).toBe(2)
  })

  it('should handle multiple children at the same level', () => {
    const input = lexicalDoc([
      paragraphNode([
        textNode({ text: 'Bold', format: '1' }),
        textNode({ text: ' normal', format: '0' }),
      ]),
      paragraphNode([textNode({ text: 'Second para', version: '1' })]),
    ])
    const result = asRecord(processRichTextField(input))
    const firstPara = asRecord(asArray(result.children)[0])
    const secondPara = asRecord(asArray(result.children)[1])
    const bold = asRecord(asArray(firstPara.children)[0])
    const normal = asRecord(asArray(firstPara.children)[1])
    const secondText = asRecord(asArray(secondPara.children)[0])
    expect(bold.format).toBe(1)
    expect(normal.format).toBe(0)
    expect(secondText.version).toBe(1)
  })

  it('should skip null and non-object entries in children without throwing', () => {
    const input = { type: 'root', version: 1, children: [null, undefined, 'stray', textNode()] }
    const result = asRecord(processRichTextField(input))
    const children = asArray(result.children)
    expect(children[0]).toBeNull()
    expect(children[1]).toBeUndefined()
    expect(children[2]).toBe('stray')
    expect(asRecord(children[3]).type).toBe('text')
  })
})

// ─── Nested non-children objects ─────────────────────────────────────────────

describe('processRichTextField — nested non-children objects', () => {
  it('should recurse into plain nested objects (e.g. decorator node data)', () => {
    const input = {
      type: 'decorator',
      version: '1',
      data: { detail: '2', label: 'keep me' },
    }
    const result = asRecord(processRichTextField(input))
    const data = asRecord(result.data)
    expect(result.version).toBe(1)
    expect(data.detail).toBe(2)
    expect(data.label).toBe('keep me')
  })
})

// ─── Full Lexical document round-trips ───────────────────────────────────────

describe('processRichTextField — full document', () => {
  it('should produce a stable result when called on an already-processed object', () => {
    const doc = lexicalDoc()
    const firstPass = processRichTextField(doc)
    const secondPass = processRichTextField(firstPass)
    expect(secondPass).toEqual(firstPass)
  })

  it('should fully round-trip a complex Lexical document serialised to JSON', () => {
    const doc = lexicalDoc([
      paragraphNode([
        textNode({ text: 'Bold', format: '1', detail: '0', indent: '0', version: '1' }),
        textNode({ text: ' normal', format: '0', version: '1' }),
      ]),
      {
        type: 'list',
        listType: 'number',
        start: '1',
        version: '1',
        indent: '0',
        direction: 'ltr',
        children: [
          { type: 'listitem', value: '1', detail: '0', format: '0', version: '1', text: 'Item A' },
          { type: 'listitem', value: '2', detail: '0', format: '0', version: '1', text: 'Item B' },
        ],
      },
    ])

    const result = asRecord(processRichTextField(JSON.stringify(doc)))

    const para = asRecord(asArray(result.children)[0])
    const boldText = asRecord(asArray(para.children)[0])
    expect(boldText.format).toBe(1)
    expect(boldText.detail).toBe(0)

    const list = asRecord(asArray(result.children)[1])
    expect(list.start).toBe(1)
    expect(list.indent).toBe(0)

    const itemA = asRecord(asArray(list.children)[0])
    const itemB = asRecord(asArray(list.children)[1])
    expect(itemA.value).toBe(1)
    expect(itemB.value).toBe(2)
  })
})
