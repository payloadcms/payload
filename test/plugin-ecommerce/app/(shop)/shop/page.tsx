import configPromise, { currenciesConfig } from '@payload-config'
import { Cart } from '@/components/Cart.js'
import { getPayload } from 'payload'
import React from 'react'
import { Product } from '@/components/Product.js'
import { CurrencySelector } from '@/components/CurrencySelector.js'
import { Payments } from '@/components/Payments.js'

export const Page = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 10,
  })

  return (
    <div>
      <h1>Shop Page - {payload?.config?.collections?.length} collections</h1>

      {products?.docs?.length > 0 ? (
        <ul>
          {products.docs.map((product) => (
            <li key={product.id}>
              <Product product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found.</p>
      )}

      <Cart />

      <CurrencySelector currenciesConfig={currenciesConfig} />

      <Payments currenciesConfig={currenciesConfig} />
    </div>
  )
}

export default Page
