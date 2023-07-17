import React from 'react'
import Link from 'next/link'

import { Order } from '../../../payload/payload-types'
import { fetchDocs } from '../../_api/fetchDocs'
import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { RenderParams } from '../../_components/RenderParams'
import { getMeUser } from '../../_utilities/getMeUser'

import classes from './index.module.scss'

const Orders = async () => {
  await getMeUser({
    nullUserRedirect: `/login?unauthorized=orders`,
  })

  const orders = await fetchDocs<Order>('orders')

  return (
    <Gutter className={classes.orders}>
      <h1>Orders</h1>
      {!orders || (orders?.length === 0 && <p>You have no orders.</p>)}
      <RenderParams />
      {orders && orders.length > 0 && (
        <ul className={classes.ordersList}>
          {orders.map(order => (
            <li key={order.id} className={classes.item}>
              <Link href={`/orders/${order.id}`}>{order.id}</Link>
            </li>
          ))}
        </ul>
      )}
      <Button href="/account" appearance="primary" label="Go to account" />
    </Gutter>
  )
}

export default Orders
