import type { PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { translations } from '../../../../translations/index.js'
import { validateOptions } from './validateOptions.js'

const messages = translations.en.translations['plugin-ecommerce'] as Record<string, string>

const createReq = (product?: Record<string, unknown>): PayloadRequest =>
  ({
    payload: { findByID: () => Promise.resolve(product) },
    t: (key: string) => {
      const [namespace, name] = key.split(':')

      return namespace === 'plugin-ecommerce' && messages[name!] ? messages[name!] : key
    },
  }) as unknown as PayloadRequest

const validate = (values: unknown, data: Record<string, unknown>, req: PayloadRequest) =>
  validateOptions()(values as never, { data, req } as never)

describe('validateOptions', () => {
  it('should return the translated message when no options are selected', async () => {
    expect(await validate([], {}, createReq())).toBe(messages.variantOptionsRequired)
  })

  it('should return the translated message when the product is missing', async () => {
    expect(await validate(['a'], {}, createReq())).toBe(messages.productRequired)
  })

  it('should return the translated message when not all variant types have an option', async () => {
    const req = createReq({ variantTypes: ['size', 'color'], variants: { docs: [] } })

    expect(await validate(['a'], { product: '1' }, req)).toBe(messages.variantOptionsRequiredAll)
  })

  it('should return the translated message when the options combination already exists', async () => {
    const req = createReq({ variantTypes: ['size'], variants: { docs: [{ options: ['a'] }] } })

    expect(await validate(['a'], { product: '1' }, req)).toBe(messages.variantOptionsAlreadyExists)
  })
})
