import { describe, expect, it } from 'vitest'
import { DeferredSchemaMap } from './DeferredSchemaMap.js'

describe('DeferredSchemaMap', () => {
  it('expands only requested branches and preserves insertion order after reverse-order reads', () => {
    const map = new DeferredSchemaMap<number>()
    const calls: string[] = []
    map.set('page', 0)
    for (const root of ['page.a', 'page.b']) {
      map.defer(root, () => {
        calls.push(root)
        map.set(root + '.first', 1)
        map.defer(root + '.nested', () => map.set(root + '.nested.value', 2))
        map.set(root + '.last', 3)
      })
    }
    map.set('after', 4)
    expect(calls).toEqual([])
    expect(map.get('page.b.nested.value')).toBe(2)
    expect(calls).toEqual(['page.b'])
    expect(map.get('page.aExtra.first')).toBeUndefined()
    expect([...map.keys()]).toEqual([
      'page',
      'page.a.first',
      'page.a.nested.value',
      'page.a.last',
      'page.b.first',
      'page.b.nested.value',
      'page.b.last',
      'after',
    ])
    expect(calls).toEqual(['page.b', 'page.a'])
  })

  it('keeps overrides, deletion/reinsertion, callback ownership and clear compatible with Map', () => {
    const map = new DeferredSchemaMap<number>()
    map.set('before', 0)
    map.defer('page.a', () => map.set('page.a.value', 1))
    map.set('after', 2)
    map.set('page.a.value', 3)
    expect([...map.values()]).toEqual([0, 3, 2])
    expect(map.delete('page.a.value')).toBe(true)
    map.set('page.a.value', 4)
    expect([...map.values()]).toEqual([0, 2, 4])
    map.forEach((value, key, owner) => {
      expect(owner).toBe(map)
      expect(value).toBe(map.get(key))
    })
    map.clear()
    expect(map.size).toBe(0)
    expect(map.get('page.a.value')).toBeUndefined()
  })

  it('supports custom features enumerating before subsequent native features register', () => {
    const map = new DeferredSchemaMap<number>()
    map.set('first', 1)
    expect([...map.keys()]).toEqual(['first'])
    map.set('second', 2)
    map.defer('third', () => map.set('third.value', 3))
    map.set('fourth', 4)
    expect([...map.keys()]).toEqual(['first', 'second', 'third.value', 'fourth'])
  })
})
