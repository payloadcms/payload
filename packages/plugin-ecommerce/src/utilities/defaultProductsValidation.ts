import type { ProductsValidation } from '../types/index.js'

import { MissingPrice, OutOfStock } from './errorCodes.js'
import { defaultInventoryFieldName } from './inventory.js'

export const defaultProductsValidation: ProductsValidation = ({
  currenciesConfig,
  currency,
  inventoryFieldName = defaultInventoryFieldName,
  product,
  quantity = 1,
  variant,
}) => {
  if (!currency) {
    throw new Error('Currency must be provided for product validation.')
  }

  const priceField = `priceIn${currency.toUpperCase()}`

  if (variant) {
    if (!variant[priceField]) {
      throw new Error(`Variant with ID ${variant.id} does not have a price in ${currency}.`)
    }

    const variantInventory = inventoryFieldName ? variant[inventoryFieldName] : undefined

    if (variantInventory === 0 || (variantInventory && variantInventory < quantity)) {
      throw new Error(
        `Variant with ID ${variant.id} is out of stock or does not have enough inventory.`,
      )
    }
  } else if (product) {
    // Validate the product's details only if the variant is not provided as it can have its own inventory and price
    if (!product[priceField]) {
      throw new Error(`Product does not have a price in.`, {
        cause: { code: MissingPrice, codes: [product.id, currency] },
      })
    }

    const productInventory = inventoryFieldName ? product[inventoryFieldName] : undefined

    if (productInventory === 0 || (productInventory && productInventory < quantity)) {
      throw new Error(`Product is out of stock or does not have enough inventory.`, {
        cause: { code: OutOfStock, codes: [product.id] },
      })
    }
  }
}
