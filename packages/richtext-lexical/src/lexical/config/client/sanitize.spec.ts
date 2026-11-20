import { describe, expect, it } from 'vitest'

import type {
  ClientFeature,
  ResolvedClientFeature,
  ResolvedClientFeatureMap,
} from '../../../features/typesClient.js'

import { sanitizeClientFeatures } from './sanitize.js'

const createFeatureMap = ({
  features,
}: {
  features: Array<{ key: string } & ClientFeature<undefined>>
}): ResolvedClientFeatureMap => {
  const featureMap: ResolvedClientFeatureMap = new Map()

  features.forEach((feature, order) => {
    featureMap.set(feature.key, { ...feature, order } as ResolvedClientFeature<undefined>)
  })

  return featureMap
}

describe('sanitizeClientFeatures', () => {
  it('should register slashMenu.dynamicGroups when the feature has no static groups', () => {
    const dynamicGroups = ({ queryString }: { queryString: string }) => [
      { items: [], key: queryString },
    ]

    const sanitized = sanitizeClientFeatures(
      createFeatureMap({ features: [{ key: 'dynamicOnly', slashMenu: { dynamicGroups } }] }),
    )

    expect(sanitized.slashMenu.dynamicGroups).toEqual([dynamicGroups])
  })

  it('should register slashMenu.dynamicGroups when the function declares no parameters', () => {
    const dynamicGroups = () => []

    const sanitized = sanitizeClientFeatures(
      createFeatureMap({
        features: [{ key: 'noParams', slashMenu: { dynamicGroups, groups: [] } }],
      }),
    )

    expect(sanitized.slashMenu.dynamicGroups).toEqual([dynamicGroups])
  })

  it('should register slashMenu.dynamicGroups from every feature in order', () => {
    const dynamicGroupsA = () => []
    const dynamicGroupsB = () => []

    const sanitized = sanitizeClientFeatures(
      createFeatureMap({
        features: [
          { key: 'a', slashMenu: { dynamicGroups: dynamicGroupsA } },
          { key: 'b', slashMenu: { dynamicGroups: dynamicGroupsB } },
        ],
      }),
    )

    expect(sanitized.slashMenu.dynamicGroups).toEqual([dynamicGroupsA, dynamicGroupsB])
  })
})
