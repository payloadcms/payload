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
import { FormError } from '@/components/forms/FormError'

type AddressFormValues = {
  title: string | null
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
  initialData?: Omit<Partial<Address>, 'country'> & { country: string }
  callback?: () => void
}

export const AddressForm: React.FC<Props> = ({ addressID, initialData, callback }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
            {errors.title && <FormError message={errors.title.message} />}
          </div>
          <div>
            <Label htmlFor="firstName" className="mb-2">
              First name*
            </Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              {...register('firstName', { required: 'First name is required.' })}
            />
            {errors.firstName && <FormError message={errors.firstName.message} />}
          </div>
          <div>
            <Label htmlFor="lastName" className="mb-2">
              Last name*
            </Label>
            <Input
              autoComplete="family-name"
              id="lastName"
              {...register('lastName', { required: 'Last name is required.' })}
            />
            {errors.lastName && <FormError message={errors.lastName.message} />}
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="mb-2">
            Phone
          </Label>
          <Input type="tel" id="phone" autoComplete="mobile tel" {...register('phone')} />
          {errors.phone && <FormError message={errors.phone.message} />}
        </div>

        <div>
          <Label htmlFor="company" className="mb-2">
            Company
          </Label>
          <Input id="company" autoComplete="organization" {...register('company')} />
          {errors.company && <FormError message={errors.company.message} />}
        </div>

        <div>
          <Label htmlFor="addressLine1" className="mb-2">
            Address line 1*
          </Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            {...register('addressLine1', { required: 'Address line 1 is required.' })}
          />
          {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
        </div>
        <div>
          <Label htmlFor="addressLine2" className="mb-2">
            Address line 2
          </Label>
          <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
          {errors.addressLine2 && <FormError message={errors.addressLine2.message} />}
        </div>

        <div>
          <Label htmlFor="city" className="mb-2">
            City*
          </Label>
          <Input
            id="city"
            autoComplete="address-level2"
            {...register('city', { required: 'City is required.' })}
          />
          {errors.city && <FormError message={errors.city.message} />}
        </div>

        <div>
          <Label htmlFor="state" className="mb-2">
            State
          </Label>
          <Input id="state" autoComplete="address-level1" {...register('state')} />
          {errors.state && <FormError message={errors.state.message} />}
        </div>

        <div>
          <Label htmlFor="postalCode" className="mb-2">
            Zip Code*
          </Label>
          <Input
            id="postalCode"
            {...register('postalCode', { required: 'Postal code is required.' })}
          />
          {errors.postalCode && <FormError message={errors.postalCode.message} />}
        </div>

        <div>
          <Label htmlFor="country" className="mb-2">
            Country*
          </Label>

          <Select
            {...register('country', {
              required: 'Country is required.',
            })}
            onValueChange={(value) => {
              setValue('country', value, { shouldValidate: true })
            }}
            required
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
          {errors.country && <FormError message={errors.country.message} />}
        </div>
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
