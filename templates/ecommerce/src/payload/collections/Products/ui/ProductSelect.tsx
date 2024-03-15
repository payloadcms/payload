import type { TextField } from 'payload/dist/fields/config/types'

import { Select, useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import * as React from 'react'

export const ProductSelect: React.FC<TextField> = (props) => {
  const { name, label } = props
  const [options, setOptions] = React.useState<
    {
      label: string
      value: string
    }[]
  >([])

  const { value: stripeProductID } = useFormFields(([fields]) => fields[name])

  React.useEffect(() => {
    const getStripeProducts = async () => {
      const productsFetch = await fetch('/api/stripe/products', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const res = await productsFetch.json()

      if (res?.data) {
        const fetchedProducts = res.data.reduce(
          (acc, item) => {
            acc.push({
              label: item.name || item.id,
              value: item.id,
            })
            return acc
          },
          [
            {
              label: 'Select a product',
              value: '',
            },
          ],
        )
        setOptions(fetchedProducts)
      }
    }

    getStripeProducts()
  }, [])

  const href = `https://dashboard.stripe.com/${
    process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
  }products/${stripeProductID}`

  return (
    <div>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Product'}</p>
      <p
        style={{
          color: 'var(--theme-elevation-400)',
          marginBottom: '0.75rem',
        }}
      >
        {`Select the related Stripe product or `}
        <a
          href={`https://dashboard.stripe.com/${
            process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
          }products/create`}
          rel="noopener noreferrer"
          style={{ color: 'var(--theme-text' }}
          target="_blank"
        >
          create a new one
        </a>
        .
      </p>
      <Select {...props} label="" options={options} />
      {Boolean(stripeProductID) && (
        <div
          style={{
            marginBottom: '1.5rem',
            marginTop: '-1rem',
          }}
        >
          <div>
            <span
              className="label"
              style={{
                color: '#9A9A9A',
              }}
            >
              {`Manage "${
                options.find((option) => option.value === stripeProductID)?.label || 'Unknown'
              }" in Stripe`}
            </span>
            <CopyToClipboard value={href} />
          </div>
          <div
            style={{
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <a
              href={`https://dashboard.stripe.com/${
                process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
              }products/${stripeProductID}`}
              rel="noreferrer noopener"
              target="_blank"
            >
              {href}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
