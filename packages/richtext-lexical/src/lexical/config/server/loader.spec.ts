import { describe, expect, it } from 'vitest'

import { FeatureProviderServer } from '../../../features/typesServer.js'
import { sortFeaturesForOptimalLoading } from './loader.js'

const createFeatureProvider = (
  key: string,
  dependenciesPriority: string[] = [],
): FeatureProviderServer<any, any, any> => ({
  key,
  dependenciesPriority,
  feature: {},
  serverFeatureProps: undefined,
})

const permutations = <T>(...items: T[]): T[][] => {
  if (items.length <= 1) {
    return [items]
  }
  return items.flatMap((head, i) => {
    const rest = items.filter((_, j) => j !== i)
    return permutations(...rest).map((tail) => [head, ...tail])
  })
}

describe('sortFeaturesForOptimalLoading', () => {
  describe('linear chain of priority dependencies', () => {
    const A = createFeatureProvider('a')
    const B = createFeatureProvider('b', ['a'])
    const C = createFeatureProvider('c', ['a', 'b'])
    const D = createFeatureProvider('d', ['c'])

    it.each(
      permutations(A, B, C, D).map((perm) => ({
        features: perm,
        featureKeys: perm.map((f) => f.key),
        expected: ['a', 'b', 'c', 'd'],
      })),
    )('sorts linear dependent features $featureKeys to $expected', ({ features, expected }) => {
      const result = sortFeaturesForOptimalLoading(features)

      expect(result.map((f) => f.key)).toEqual(expected)
    })
  })

  describe('diamond priority dependencies', () => {
    const A = createFeatureProvider('a')
    const B = createFeatureProvider('b', ['a'])
    const C = createFeatureProvider('c', ['a'])
    const D = createFeatureProvider('d', ['b', 'c'])

    it.each(
      permutations(A, B, C, D).map((perm) => ({
        features: perm,
        featureKeys: perm.map((f) => f.key),
      })),
    )('sorts $featureKeys such that comes first and d last', ({ features }) => {
      const result = sortFeaturesForOptimalLoading(features)

      expect(result.at(0)?.key).toEqual('a')
      expect(result.at(-1)?.key).toEqual('d')
    })
  })

  describe('no dependencies', () => {
    const A = createFeatureProvider('a')
    const B = createFeatureProvider('b')
    const C = createFeatureProvider('c')

    it.each(
      permutations(A, B, C).map((perm) => ({
        features: perm,
        featureKeys: perm.map((f) => f.key),
      })),
    )('keeps the ordering of $featureKeys as is', ({ features, featureKeys }) => {
      const result = sortFeaturesForOptimalLoading(features)
      expect(result.map((f) => f.key)).toEqual(featureKeys)
    })
  })
})
