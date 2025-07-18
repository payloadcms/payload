import type { ProductsValidation } from '../types.js'

export const defaultProductsValidation: ProductsValidation = ({
  currenciesConfig,
  currency,
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

    if (variant.inventory === 0 || (variant.inventory && variant.inventory < quantity)) {
      throw new Error(
        `Variant with ID ${variant.id} is out of stock or does not have enough inventory.`,
      )
    }
  }

  if (product) {
    if (!product[priceField]) {
      throw new Error(`Product with ID ${product.id} does not have a price in ${currency}.`)
    }

    if (product.inventory === 0 || (product.inventory && product.inventory < quantity)) {
      throw new Error(
        `Product with ID ${product.id} is out of stock or does not have enough inventory.`,
      )
    }
  }
}
