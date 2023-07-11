'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Order } from '../../../payload-types'
import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { useAuth } from '../../_providers/Auth'

import classes from './index.module.scss'

const Orders: React.FC = () => {
  const [error] = useState('')
  const [success, setSuccess] = useState('')
  const { user } = useAuth()

  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>()

  useEffect(() => {
    if (user) {
      // no need to add a 'where' query here, the access control is handled by the API
      const fetchOrders = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders`, {
          credentials: 'include',
        })

        if (response.ok) {
          const json = await response.json()
          setOrders(json.docs)
        }
      }
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    if (user === null) {
      router.push(`/login?unauthorized=account`)
    }
  }, [user, router])

  useEffect(() => {
    const success = searchParams.get('success')
    if (success) {
      setSuccess(success)
    }
  }, [router, searchParams])

  return (
    <Gutter className={classes.orders}>
      <h1>Orders</h1>
      {error && <div className={classes.error}>{error}</div>}
      {success && <div className={classes.success}>{success}</div>}
      {!orders || (orders.length === 0 && <p>You have no orders.</p>)}
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
