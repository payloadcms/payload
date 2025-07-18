'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  orderID: string
}

export const FindOrderForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    router.push(`/orders/${data.orderID}?email=${data.email}`)
  }, [])

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Find my order</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>{`Please enter your email and order ID below.`}</p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />
            <div className="mb-8">
              <Label htmlFor="email" className="mb-2">
                Email address
              </Label>
              <Input id="email" {...register('email', { required: true })} required type="email" />
            </div>
            <div className="mb-8">
              <Label htmlFor="orderID" className="mb-2">
                Order ID
              </Label>
              <Input
                id="orderID"
                {...register('orderID', { required: true })}
                required
                type="text"
              />
            </div>
            <Button type="submit" variant="default">
              Find my order
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Request submitted</h1>
          <div className="prose dark:prose-invert">
            <p>Check your email for a link that will allow you to securely reset your password.</p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
