'use client'
import type { OptionObject, StaticLabel, TextField, TextFieldClientProps } from 'payload'
import type Stripe from 'stripe'

import { useField, useFormFields, withCondition } from '@payloadcms/ui'
import { CopyToClipboard } from '@payloadcms/ui/elements/CopyToClipboard'
import { SelectInput } from '@payloadcms/ui/fields/Select'
import React, { useCallback, useEffect } from 'react'

import type { InfoType } from '../types'

type ProductOption = {
  label: string
  price?: {
    amount: number
    currency: string
  }
  value: string
}

type Props = {
  path: string
  name: string
  label?: StaticLabel
}

export const Component: React.FC<Props> = (props) => {
  const { label, name, path } = props

  const { setValue, value: stripeProductID } = useField<string>({ path })

  const [currentPath] = path.split(/\.(?=[^.]+$)/)
  const infoPath = path.includes('.') ? currentPath + '.info' : 'info'
  const [options, setOptions] = React.useState<ProductOption[]>([])

  const { dispatchFields, infoField } = useFormFields(([fields, dispatchFields]) => {
    return {
      dispatchFields,
      infoField: fields[infoPath],
    }
  })

  const info = infoField?.value

  useEffect(() => {
    const getStripeProducts = async () => {
      const productsFetch = await fetch('/api/stripe/products', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const res = await productsFetch.json()

      if (res?.data && Array.isArray(res?.data)) {
        const data = res.data as Stripe.Product[]
        const fetchedProducts = data.reduce<ProductOption[]>(
          (acc, item) => {
            if (typeof item.default_price !== 'string')
              acc.push({
                label: item.name || item.id,
                price: {
                  amount: item.default_price?.unit_amount || 0,
                  currency: item.default_price?.currency || 'USD',
                },
                value: item.id,
              })
            return acc
          },
          [
            {
              label: 'Select a product',
              value: '',
            },
          ] as ProductOption[],
        )
        setOptions(fetchedProducts)
      }
    }

    void getStripeProducts()
  }, [])

  const handleUpdate = useCallback(
    (newValue: OptionObject) => {
      const existingInfo = info ? (info as InfoType) : {}

      const newInfo: Partial<InfoType> = {
        ...existingInfo,
        price: options.find((option) => option.value === newValue.value)?.price || undefined,
        productName: options.find((option) => option.value === newValue.value)?.label || '',
      }

      dispatchFields({
        type: 'UPDATE',
        path: infoPath,
        value: newInfo,
      })

      setValue(newValue.value)
    },
    [setValue, dispatchFields, options, info, infoPath],
  )

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

      <SelectInput
        name={name!}
        onChange={handleUpdate}
        options={options}
        path={path}
        value={stripeProductID}
      />
      {Boolean(stripeProductID) && (
        <div
          style={{
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

export const ComponentClient = withCondition(Component)
