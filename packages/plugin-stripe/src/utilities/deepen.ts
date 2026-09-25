// converts an object of dot notation keys to a nested object
// i.e. { 'price.stripePriceID': '123' } to { price: { stripePriceID: '123' } }

import { hasUnsupportedFieldPathSegment, setOwnProperty } from 'payload/shared'

import type { FieldSyncConfig } from '../types.js'

export const deepen = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const keys = key.split('.')

    if (hasUnsupportedFieldPathSegment({ segments: keys })) {
      throw new Error('Invalid field path.')
    }

    let current = result
    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        setOwnProperty({ key: k, target: current, value })
      } else {
        if (!Object.hasOwn(current, k) || current[k] === null || typeof current[k] !== 'object') {
          setOwnProperty({ key: k, target: current, value: {} })
        }
        current = current[k]
      }
    })
  }
  return result
}

export const getSyncedFields = ({
  data,
  fields,
  source,
}: {
  data: object
  fields: FieldSyncConfig[]
  source: 'payload' | 'stripe'
}): Record<string, unknown> => {
  const flattened = Object.create(null) as Record<string, unknown>

  for (const { fieldPath, stripeProperty } of fields) {
    const sourceProperty = source === 'payload' ? fieldPath : stripeProperty
    const targetProperty = source === 'payload' ? stripeProperty : fieldPath
    const value = Object.hasOwn(data, sourceProperty)
      ? (data as Record<string, unknown>)[sourceProperty]
      : undefined

    setOwnProperty({ key: targetProperty, target: flattened, value })
  }

  return deepen(flattened)
}
