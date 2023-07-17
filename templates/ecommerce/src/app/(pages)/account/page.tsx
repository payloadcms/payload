import React from 'react'
import Link from 'next/link'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { RenderParams } from '../../_components/RenderParams'
import { getMeUser } from '../../_utilities/getMeUser'
import AccountForm from './Form'

import classes from './index.module.scss'

const Account = async () => {
  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to access your account.',
    )}`,
  })

  return (
    <Gutter className={classes.account}>
      <RenderParams className={classes.params} />
      <h1>Account</h1>
      <AccountForm />
      <hr className={classes.hr} />
      <h2>Purchased Products</h2>
      <div>
        {user?.purchases?.length || 0 > 0 ? (
          user?.purchases?.map(purchase => {
            if (typeof purchase === 'string') {
              return (
                <div key={purchase}>
                  <h4>{purchase}</h4>
                </div>
              )
            }
            return (
              <Link key={purchase.id} href={`/products/${purchase.slug}`}>
                <h4>{purchase.title}</h4>
              </Link>
            )
          })
        ) : (
          <div>You have no purchases.</div>
        )}
      </div>
      <hr className={classes.hr} />
      <h2>Orders</h2>
      <Button
        className={classes.ordersButton}
        href="/orders"
        appearance="primary"
        label="View orders"
      />
      <hr className={classes.hr} />
      <Button href="/logout" appearance="secondary" label="Log out" />
    </Gutter>
  )
}

export default Account
