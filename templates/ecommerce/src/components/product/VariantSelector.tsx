'use client'

// import { generateCombinations } from '@/collections/Products/ui/Variants/VariantSelect/buildCombinations'
import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants) {
    return null
  }

  /**
   * Flattened array of all possible variant combinations.
   */
  const combinations = useMemo(() => {
    if (!variantTypes) return []

    return []
  }, [variants])

  const isAvailableForSale = useMemo(() => {
    if (!variants || !variantTypes) return false

    const optionSearchParams = new URLSearchParams(searchParams.toString())

    // Remove image and variant ID from this search params so we can loop over it safely.
    optionSearchParams.delete('variant')
    optionSearchParams.delete('image')

    // Parse the current options from the search params
    const currentOptions = Object.fromEntries(optionSearchParams.entries())

    // Find a matching variant
    const matchingVariant = variants.find((variant) => {
      if (!variant.options || !Array.isArray(variant.options)) return false

      // Check if all variant options match the current options in the URL
      return variant.options.every((variantOption) => {
        const variantType = variantTypes.find((type) => type.id === variantOption.variantType)
        if (!variantType) return false

        return currentOptions[variantType.name] === variantOption.value
      })
    })

    return Boolean(matchingVariant)
  }, [searchParams, variants, variantTypes])

  return variantTypes?.map((type) => {
    if (!type || typeof type !== 'object') {
      return <></>
    }

    const options = type.options?.docs

    if (!options || !Array.isArray(options) || !options.length) {
      return <></>
    }

    return (
      <dl className="" key={type.id}>
        isAvailableForSale: {isAvailableForSale ? 'true' : 'false'}
        <dt className="mb-4 text-sm">{type.label}</dt>
        <dd className="flex flex-wrap gap-3">
          <React.Fragment>
            {options?.map((option) => {
              if (!option || typeof option !== 'object') {
                return <></>
              }

              const optionID = option.value
              const optionKeyLowerCase = type.name

              // Base option params on current params so we can preserve any other param state in the url.
              const optionSearchParams = new URLSearchParams(searchParams.toString())

              // Remove image and variant ID from this search params so we can loop over it safely.
              optionSearchParams.delete('variant')
              optionSearchParams.delete('image')

              // Update the option params using the current option to reflect how the url *would* change,
              // if the option was clicked.
              optionSearchParams.set(optionKeyLowerCase, optionID)

              const optionUrl = createUrl(pathname, optionSearchParams)

              // Read the previous options from the search params and find the existing variant that matches the current options.
              // This is used to determine if the option is available for sale.

              const isAvailableForSale = true

              // The option is active if it's in the url params.
              const isActive =
                Boolean(isAvailableForSale) && searchParams.get(optionKeyLowerCase) === option.value

              return (
                <Button
                  variant={'ghost'}
                  aria-disabled={!isAvailableForSale}
                  className={clsx('px-2', {
                    'bg-primary/5 text-primary': isActive,
                  })}
                  disabled={!isAvailableForSale}
                  key={option.id}
                  onClick={() => {
                    router.replace(`${optionUrl}`, {
                      scroll: false,
                    })
                  }}
                  title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                >
                  {option.label}
                </Button>
              )
            })}
          </React.Fragment>
        </dd>
      </dl>
    )
  })
}
