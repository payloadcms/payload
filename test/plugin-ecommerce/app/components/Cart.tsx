'use client'

import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/react'

export const Cart = () => {
  const { cart, incrementItem, decrementItem, removeItem, subTotal, clearCart } = useCart()
  const { formatCurrency } = useCurrency()

  return (
    <div>
      <h1>Cart Component</h1>
      <p>This is a placeholder for the Cart component.</p>

      <p>subTotal: {formatCurrency(subTotal)}</p>

      {cart && cart.size > 0 ? (
        <ul>
          {Array.from(cart.values()).map((item, index) => {
            const id = item.variantID || item.productID

            const options =
              item.variant?.options && item.variant.options.length > 0
                ? item.variant.options
                    .filter((option) => typeof option !== 'string')
                    .map((option) => {
                      return option.label
                    })
                : []

            return (
              <li key={id}>
                <h2>
                  {item.product.name} {options.length > 0 ? `(${options.join(' – ')})` : ''}
                </h2>
                <p>Quantity: {item.quantity}</p>
                <button onClick={() => incrementItem(id)}>+</button>
                <button onClick={() => decrementItem(id)}>-</button>
                <button onClick={() => removeItem(id)}>Remove</button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>Your cart is empty.</p>
      )}

      <button
        onClick={() => {
          clearCart()
        }}
      >
        Clear all
      </button>

      {/* <pre>{JSON.stringify(Array.from(cart.entries()), null, 2)}</pre> */}
    </div>
  )
}
