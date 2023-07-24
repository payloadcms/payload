import React from 'react'

const LinkToOrders: React.FC = () => {
  const href = `https://dashboard.stripe.com/${
    process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
  }invoices`

  return (
    <div>
      <a href={href} rel="noopener noreferrer" target="_blank">
        Orders
      </a>
    </div>
  )
}

export default LinkToOrders
