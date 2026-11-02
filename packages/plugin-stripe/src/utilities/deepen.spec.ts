import { describe, expect, it } from 'vitest'

import { deepen, getSyncedFields } from './deepen.js'

describe('Stripe field mappings', () => {
  it('should build constrained mappings from owned values', () => {
    const marker = 'constrainedStripeMapping'
    const inheritedSource = 'constrainedStripeSource'
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, marker)
    let inheritedGetterCalls = 0
    let processStateChanged = false
    let nestedMapping: Record<string, unknown> | undefined
    let syncedMapping: Record<string, unknown> | undefined
    let webhookMapping: Record<string, unknown> | undefined

    try {
      expect(() => deepen({ [`__proto__.${marker}`]: 'value' })).toThrow('Invalid field path.')

      nestedMapping = deepen(
        Object.assign(Object.create({ 'ignored.value': 'inherited' }), {
          [`constructor.prototype.${marker}`]: 'local',
          'profile.displayName': 'Ada',
        }),
      )

      const data = Object.create({
        get [inheritedSource]() {
          inheritedGetterCalls += 1
          return 'inherited'
        },
      }) as Record<string, unknown>
      data.displayName = 'Ada'

      syncedMapping = getSyncedFields({
        data,
        fields: [
          { fieldPath: inheritedSource, stripeProperty: 'metadata.inherited' },
          { fieldPath: 'constructor', stripeProperty: 'constructor' },
          {
            fieldPath: 'displayName',
            stripeProperty: `constructor.prototype.${marker}`,
          },
        ],
        source: 'payload',
      })

      const stripeData = Object.create({
        get [inheritedSource]() {
          inheritedGetterCalls += 1
          return 'inherited'
        },
      }) as Record<string, unknown>
      stripeData.name = 'Ada'

      webhookMapping = getSyncedFields({
        data: stripeData,
        fields: [
          { fieldPath: 'profile.inherited', stripeProperty: inheritedSource },
          { fieldPath: 'profile.displayName', stripeProperty: 'name' },
        ],
        source: 'stripe',
      })
      processStateChanged = Object.hasOwn(Object.prototype, marker)
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Object.prototype, marker, originalDescriptor)
      } else {
        delete (Object.prototype as Record<string, unknown>)[marker]
      }
    }

    expect(processStateChanged).toBe(false)
    expect(inheritedGetterCalls).toBe(0)
    expect(Object.getOwnPropertyDescriptor(Object.prototype, marker)).toEqual(originalDescriptor)
    expect(nestedMapping).toEqual({
      constructor: {
        prototype: {
          [marker]: 'local',
        },
      },
      profile: {
        displayName: 'Ada',
      },
    })
    expect(Object.hasOwn(nestedMapping as object, 'ignored')).toBe(false)
    expect(syncedMapping).toEqual({
      constructor: {
        prototype: {
          [marker]: 'Ada',
        },
      },
      metadata: {
        inherited: undefined,
      },
    })
    expect(webhookMapping).toEqual({
      profile: {
        displayName: 'Ada',
        inherited: undefined,
      },
    })
  })
})
