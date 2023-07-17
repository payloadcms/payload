import * as React from 'react'
import { Select, useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { TextField } from 'payload/dist/fields/config/types'

export const CustomerSelect: React.FC<TextField> = props => {
  const { name, label } = props
  const [options, setOptions] = React.useState([])

  const { value: stripeCustomerID } = useFormFields(([fields]) => fields[name]) || {}

  React.useEffect(() => {
    const getStripeCustomers = async () => {
      try {
        const customersFetch = await fetch('/api/stripe/rest', {
          method: 'post',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripeMethod: 'customers.list',
            stripeArgs: [
              {
                limit: 100,
              },
            ],
          }),
        })

        const res = await customersFetch.json()

        const { data } = res

        if (!data) {
          throw new Error('No data returned from Stripe')
        }

        if ('data' in data) {
          const fetchedCustomers = data.data.reduce(
            (acc, item) => {
              acc.push({
                label: item.name || item.id,
                value: item.id,
              })
              return acc
            },
            [
              {
                label: 'Select a customer',
                value: '',
              },
            ],
          )
          setOptions(fetchedCustomers)
        }
      } catch (error) {
        console.error(error) // eslint-disable-line no-console
      }
    }

    getStripeCustomers()
  }, [])

  const href = `https://dashboard.stripe.com/${
    process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
  }customers/${stripeCustomerID}`

  return (
    <div>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Customer'}</p>
      <p
        style={{
          marginBottom: '0.75rem',
          color: 'var(--theme-elevation-400)',
        }}
      >
        {`Select the related Stripe customer or `}
        <a
          href={`https://dashboard.stripe.com/${
            process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY ? 'test/' : ''
          }customers/create`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--theme-text' }}
        >
          create a new one
        </a>
        {'.'}
      </p>
      <Select {...props} label="" options={options} />
      {stripeCustomerID && (
        <div>
          <div>
            <span
              className="label"
              style={{
                color: '#9A9A9A',
              }}
            >
              {`Manage "${
                options.find(option => option.value === stripeCustomerID)?.label
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
              }customers/${stripeCustomerID}`}
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
