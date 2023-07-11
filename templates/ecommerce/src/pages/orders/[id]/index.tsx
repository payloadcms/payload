import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Button } from '../../../components/Button'
import { Gutter } from '../../../components/Gutter'
import { Media } from '../../../components/Media'
import { getApolloClient } from '../../../graphql'
import { HEADER_QUERY } from '../../../graphql/globals'
import { Order as OrderType } from '../../../payload-types'
import { useAuth } from '../../../providers/Auth'

import classes from './index.module.scss'

const Order: React.FC = () => {
  const [error] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const router = useRouter()
  const { query } = router
  const [order, setOrder] = useState<OrderType>()

  useEffect(() => {
    setLoading(true)

    if (user && query.id) {
      // no real need to add a 'where' query here since the access control is handled by the API
      const fetchOrder = async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${query.id}`,
          {
            credentials: 'include',
          },
        )

        if (response.ok) {
          const json = await response.json()
          setOrder(json)
        }

        setLoading(false)
      }
      fetchOrder()
    }
  }, [user, query])

  useEffect(() => {
    if (user === null) {
      router.push(`/login?unauthorized=account`)
    }
  }, [user, router])

  return (
    <Gutter className={classes.orders}>
      <h1>Order</h1>
      <p>{`Order ID: ${query.id}`}</p>
      {error && <div className={classes.error}>{error}</div>}
      {loading && <div className={classes.loading}>{`Loading order ${query.id}...`}</div>}
      {order && (
        <div className={classes.order}>
          <h4 className={classes.orderTitle}>Items</h4>
          {order.items?.map((item, index) => {
            let product

            if (typeof item.product === 'object') {
              product = item.product
            }

            const isLast = index === order.items.length - 1

            return (
              <ul className={classes.itemsList} key={index}>
                <li className={classes.item}>
                  <div className={classes.row}>
                    <div className={classes.mediaWrapper}>
                      {!product.meta.image && <span className={classes.placeholder}>No image</span>}
                      {product.meta.image && typeof product.meta.image !== 'string' && (
                        <Media imgClassName={classes.image} resource={product.meta.image} fill />
                      )}
                    </div>
                    <div className={classes.rowContent}>
                      <Link href={`/products/${product.slug}`}>
                        <h6 className={classes.title}>{product.title}</h6>
                      </Link>
                      <div>{`Quantity ${item.quantity}`}</div>
                      <div>
                        {/* TODO: get actual price */}
                        {`Price: $${0}`}
                      </div>
                    </div>
                  </div>
                  {!isLast && <hr className={classes.rowHR} />}
                </li>
              </ul>
            )
          })}
        </div>
      )}
      <h4>
        {/* TODO: get actual price */}
        {`Order Total: $0`}
      </h4>
      <br />
      <Button href="/orders" appearance="primary" label="See all orders" />
      <br />
      <br />
      <Button href="/account" appearance="secondary" label="Go to account" />
    </Gutter>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: HEADER_QUERY,
  })

  return {
    props: {
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  }
}

export default Order
