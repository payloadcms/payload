import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const Page = async ({ params, searchParams }) => {
  const payload = await getPayload({
    config: configPromise,
  })

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 10,
  })

  console.log({ products })

  return (
    <div>
      <h1>Shop Page - {payload?.config?.collections?.length} collections</h1>

      {products?.docs?.length > 0 ? (
        <ul>
          {products.docs.map((product) => (
            <li key={product.id}>
              <h2>{product.name}</h2>
              {/* <p>{product.description}</p> */}
              <p>{/* Price: {product.price?.amount} {product.price?.currency} */}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  )
}

export default Page
