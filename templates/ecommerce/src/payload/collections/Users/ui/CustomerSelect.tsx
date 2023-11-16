import * as React from 'react'
import { Select, useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { TextField } from 'payload/dist/fields/config/types'

export const CustomerSelect: React.FC<TextField> = props => {
  const { name, label } = props
  const [options, setOptions] = React.useState<
    {
      label: string
      value: string
    }[]
  >([])

  const { value: stripeCustomerID } = useFormFields(([fields]) => fields[name]) || {}

  React.useEffect(() => {
    const getStripeCustomers = async () => {
      try {
        const customersFetch = await fetch(`/api/stripe/customers`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const res = await customersFetch.json()

        if (res?.data) {
          const fetchedCustomers = res.data.reduce(
            (acc, item) => {
              acc.push({
                label: item.name || item.email || item.id,
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
      {Boolean(stripeCustomerID) && (
        <div>
          <div>
            <span
              className="label"
              style={{
                color: '#9A9A9A',
              }}
            >
              {`Manage "${
                options.find(option => option.value === stripeCustomerID)?.label || 'Unknown'
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
