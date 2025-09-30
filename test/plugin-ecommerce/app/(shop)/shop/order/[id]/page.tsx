import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const Page = async ({ params: paramsPromise }: { params: Promise<{ id: string }> }) => {
  const payload = await getPayload({
    config: configPromise,
  })

  const searchParams = await paramsPromise

  const orderID = searchParams.id

  const order = await payload.findByID({
    collection: 'orders',
    id: orderID,
    depth: 2,
  })

  return (
    <div>
      Order id: {searchParams.id}
      <div>
        <h1>Shop Page - {payload?.config?.collections?.length} collections</h1>

        {order ? (
          <div>
            <h2>Order Details</h2>
            <pre>{JSON.stringify(order, null, 2)}</pre>
          </div>
        ) : (
          <p>No order found with ID {orderID}.</p>
        )}
      </div>
    </div>
  )
}

export default Page
