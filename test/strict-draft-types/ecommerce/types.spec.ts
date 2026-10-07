import type { Payload } from 'payload'

import { AddToCart } from '@/components/Cart/AddToCart'
import { ProductDescription } from '@/components/product/ProductDescription'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from '@/components/product/VariantSelector'
import { generateMeta } from '@/utilities/generateMeta'
import { expect, test } from 'tstyche'

declare const payload: Payload
declare const draft: boolean

test('should accept a product queried with a draft mode flag throughout the product consumer chain', async () => {
  const { docs } = await payload.find({ collection: 'products', draft })
  const product = docs[0]!

  expect(ProductDescription).type.toBeCallableWith({ product })
  expect(VariantSelector).type.toBeCallableWith({ product })
  expect(StockIndicator).type.toBeCallableWith({ product })
  expect(AddToCart).type.toBeCallableWith({ product })
})

test('should accept incomplete draft products throughout the product consumer chain', () => {
  expect(ProductDescription).type.toBeCallableWith({ product: { id: 'id' } })
  expect(VariantSelector).type.toBeCallableWith({ product: { id: 'id' } })
  expect(StockIndicator).type.toBeCallableWith({ product: { id: 'id' } })
  expect(AddToCart).type.toBeCallableWith({ product: { id: 'id' } })
})

test('should require product IDs throughout the product consumer chain', () => {
  expect(ProductDescription).type.not.toBeCallableWith({ product: {} })
  expect(VariantSelector).type.not.toBeCallableWith({ product: {} })
  expect(StockIndicator).type.not.toBeCallableWith({ product: {} })
  expect(AddToCart).type.not.toBeCallableWith({ product: {} })
})

test('should generate metadata from an incomplete draft or a missing page', () => {
  expect(generateMeta).type.toBeCallableWith({ doc: { id: 'id' } })
  expect(generateMeta).type.toBeCallableWith({ doc: null })
})
