import * as React from 'react'
import { Select, useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { TextField } from 'payload/dist/fields/config/types'

export const ProductSelect: React.FC<TextField> = props => {
  const { name, label } = props
  const [options, setOptions] = React.useState([])

  const { value: stripeProductID } = useFormFields(([fields]) => fields[name])

  React.useEffect(() => {
    const getStripeProducts = async () => {
      const productsFetch = await fetch('/api/stripe/rest', {
        method: 'post',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripeMethod: 'products.list',
          stripeArgs: [
            {
              limit: 100,
            },
          ],
        }),
      })

      const res = await productsFetch.json()

      const { data } = res

      if ('data' in data) {
        const fetchedProducts = data.data.reduce(
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
          marginBottom: '0.75rem',
          color: 'var(--theme-elevation-400)',
        }}
      >
        {`Select the related Stripe product or `}
        <a
          href={`https://dashboard.stripe.com/${
            process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
          }products/create`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--theme-text' }}
        >
          create a new one
        </a>
        {'.'}
      </p>
      <Select {...props} label="" options={options} />
      {stripeProductID && (
        <div
          style={{
            marginTop: '-1rem',
            marginBottom: '1.5rem',
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
                options.find(option => option.value === stripeProductID)?.label
              }" in Stripe`}
            </span>
            <CopyToClipboard value={href} />
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: '600',
            }}
          >
            <a
              href={`https://dashboard.stripe.com/${
                process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
              }products/${stripeProductID}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {href}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
