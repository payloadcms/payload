'use client'

import { generateCombinations } from '@/collections/Products/ui/Variants/VariantSelect/buildCombinations'
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
  const variants = product.variants
  const variantOptions = product.variantOptions
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantOptions?.length)

  if (!hasVariants) {
    return null
  }

  /**
   * Flattened array of all possible variant combinations.
   */
  const combinations = useMemo(() => {
    if (!variantOptions) return []

    return generateCombinations(variantOptions)
  }, [variants])

  return variantOptions?.map((key) => {
    const options = key.options

    return (
      <dl className="" key={key.slug}>
        <dt className="mb-4 text-sm">{key.label}</dt>
        <dd className="flex flex-wrap gap-3">
          <React.Fragment>
            {options?.map((option) => {
              const optionSlug = option.slug
              const optionKeyLowerCase = key.slug.toLowerCase()

              // Base option params on current params so we can preserve any other param state in the url.
              const optionSearchParams = new URLSearchParams(searchParams.toString())

              // Remove image and variant ID from this search params so we can loop over it safely.
              optionSearchParams.delete('variant')
              optionSearchParams.delete('image')

              // Update the option params using the current option to reflect how the url *would* change,
              // if the option was clicked.
              optionSearchParams.set(optionKeyLowerCase, option.slug)

              const optionUrl = createUrl(pathname, optionSearchParams)

              // In order to determine if an option is available for sale, we need to:
              //
              // 1. Filter out all other param state
              // 2. Filter out invalid options
              // 3. Check if the option combination is available for sale
              //
              // This is the "magic" that will cross check possible variant combinations and preemptively
              // disable combinations that are not available. For example, if the color gray is only available in size medium,
              // then all other sizes should be disabled.
              // const filtered = Array.from(optionSearchParams.entries()).filter(([key, value]) => {
              //   return combinations?.find((combination) => {
              //     const option = variants?.find((option) => {
              //       return option.options.find((option) => {
              //         return option.slug === key && option.value === value
              //       })
              //     })

              //     return option?.slug === value
              //   })
              // })

              const existingVariant = variants?.find((variant) => {
                const hasOption = variant.options.every((variantOption) => {
                  return variantOption.value === optionSlug
                })

                return hasOption
              })

              const isAvailableForSale = Boolean(existingVariant?.id && existingVariant?.stock > 0)

              // The option is active if it's in the url params.
              const isActive =
                Boolean(isAvailableForSale) && searchParams.get(optionKeyLowerCase) === option.slug

              return (
                <Button
                  variant={'ghost'}
                  aria-disabled={!isAvailableForSale}
                  className={clsx('px-2', {
                    'bg-primary/5 text-primary': isActive,
                  })}
                  disabled={!isAvailableForSale}
                  key={option.slug}
                  onClick={() => {
                    router.replace(`${optionUrl}&variant=${existingVariant?.id}`, {
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
