'use client'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddresses } from '@payloadcms/plugin-ecommerce/react'
import { defaultCountries as supportedCountries } from '@payloadcms/plugin-ecommerce/addresses'
import { Address, Config } from '@/payload-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { titles } from './constants'
import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'

type AddressFormValues = {
  title: string
  firstName: string
  lastName: string
  company?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode: string
  country: string
  phone?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Partial<Address>
  callback?: () => void
}

export const AddressForm: React.FC<Props> = ({ addressID, initialData, callback }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AddressFormValues>({
    defaultValues: initialData,
  })

  const { createAddress, updateAddress } = useAddresses()

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const newData = deepMergeSimple(initialData || {}, data)

      if (addressID) {
        await updateAddress(addressID, newData)
      } else {
        await createAddress(newData)
      }

      if (callback) {
        callback()
      }
    },
    [addressID, initialData, callback],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex gap-4">
          <div className="shrink">
            <Label htmlFor="title" className="mb-2">
              Title
            </Label>

            <Select
              {...register('title')}
              onValueChange={(value) => {
                setValue('title', value, { shouldValidate: true })
              }}
              defaultValue={initialData?.title || ''}
            >
              <SelectTrigger id="title">
                <SelectValue placeholder="Title" />
              </SelectTrigger>
              <SelectContent>
                {titles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.title && <p>{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="firstName" className="mb-2">
              First name
            </Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              {...register('firstName', { required: 'First name is required' })}
            />
            {errors.firstName && <p>{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName" className="mb-2">
              Last name
            </Label>
            <Input
              autoComplete="family-name"
              id="lastName"
              {...register('lastName', { required: 'Last name is required' })}
            />
            {errors.lastName && <p>{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="mb-2">
            Phone
          </Label>
          <Input type="tel" id="phone" autoComplete="mobile tel" {...register('phone')} />
          {errors.phone && <p>{errors.phone.message}</p>}
        </div>

        <div>
          <Label htmlFor="company" className="mb-2">
            Company
          </Label>
          <Input id="company" autoComplete="organization" {...register('company')} />
          {errors.company && <p>{errors.company.message}</p>}
        </div>

        <div>
          <Label htmlFor="addressLine1" className="mb-2">
            Address line 1
          </Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            {...register('addressLine1', { required: 'Address line 1 is required' })}
          />
          {errors.addressLine1 && <p>{errors.addressLine1.message}</p>}
        </div>
        <div>
          <Label htmlFor="addressLine2" className="mb-2">
            Address line 2
          </Label>
          <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
          {errors.addressLine2 && <p>{errors.addressLine2.message}</p>}
        </div>

        <div>
          <Label htmlFor="city" className="mb-2">
            City
          </Label>
          <Input
            id="city"
            autoComplete="address-level2"
            {...register('city', { required: 'City is required' })}
          />
          {errors.city && <p>{errors.city.message}</p>}
        </div>

        <div>
          <Label htmlFor="state" className="mb-2">
            State
          </Label>
          <Input id="state" autoComplete="address-level1" {...register('state')} />
          {errors.state && <p>{errors.state.message}</p>}
        </div>

        <div>
          <Label htmlFor="postalCode" className="mb-2">
            Zip Code
          </Label>
          <Input
            id="postalCode"
            {...register('postalCode', { required: 'Postal code is required' })}
          />
          {errors.postalCode && <p>{errors.postalCode.message}</p>}
        </div>

        <div>
          <Label htmlFor="country" className="mb-2">
            Country
          </Label>

          <Select
            {...register('country', {
              required: 'Country is required',
            })}
            onValueChange={(value) => {
              setValue('country', value, { shouldValidate: true })
            }}
            defaultValue={initialData?.country || ''}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {supportedCountries.map((country) => {
                const value = typeof country === 'string' ? country : country.value
                const label =
                  typeof country === 'string'
                    ? country
                    : typeof country.label === 'string'
                      ? country.label
                      : value

                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {errors.country && <p>{errors.country.message}</p>}
        </div>
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
