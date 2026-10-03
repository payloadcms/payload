import { describe, expect, it } from 'vitest'
import { LazySchemaMap } from './LazySchemaMap.js'

describe('LazySchemaMap', () => {
  it('should defer conversions until requested and exclude sibling prefixes', () => {
    let calls = 0
    const map = new LazySchemaMap({
      source: new Map([
        ['page.body.a', 1],
        ['page.body.b', 2],
        ['page.bodyExtra.secret', 3],
      ]),
      convert: (value) => {
        calls++
        return String(value)
      },
    })
    map.defer('page.body')
    expect(calls).toBe(0)
    expect(map.has('page.body.a')).toBe(true)
    expect(calls).toBe(0)
    expect(map.get('page.body.a')).toBe('1')
    expect(calls).toBe(1)
    expect(map.has('page.bodyExtra.secret')).toBe(false)
    expect(map.get('page.bodyExtra.secret')).toBeUndefined()
  })

  it('should preserve enumeration, callback ownership, overrides, delete and clear', () => {
    const map = new LazySchemaMap({
      source: new Map([
        ['page.body.a', 1],
        ['page.body.b', 2],
      ]),
      convert: String,
    })
    map.defer('page.body')
    map.set('page.body.a', 'override')
    expect([...map]).toEqual([
      ['page.body.a', 'override'],
      ['page.body.b', '2'],
    ])
    expect([...map.keys()]).toEqual(['page.body.a', 'page.body.b'])
    expect([...map.values()]).toEqual(['override', '2'])
    const entries: string[] = []
    map.forEach((value, key, owner) => {
      expect(owner).toBe(map)
      entries.push(key + value)
    })
    expect(entries).toHaveLength(2)
    expect(map.size).toBe(2)
    expect(map.delete('page.body.a')).toBe(true)
    expect(map.has('page.body.a')).toBe(false)
    map.clear()
    expect(map.size).toBe(0)
    expect(map.get('page.body.b')).toBeUndefined()
  })

  it('should clear deferred entries without converting them', () => {
    const map = new LazySchemaMap({
      source: new Map([['page.body.a', 1]]),
      convert: () => {
        throw new Error('unused')
      },
    })
    map.defer('page.body')
    map.clear()
    expect([...map]).toEqual([])
  })
})
