'use client'

import type { Product } from '@/payload-types'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.variants
  const variantOptions = product.variants?.options
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantOptions?.length)

  if (!hasVariants) {
    return null
  }

  /**
   * Flattened array of all possible variant combinations.
   */
  const combinations = variants!.map((variant) => {
    return variant.options
  })

  return variantOptions?.map((key) => {
    const options = key.values

    return (
      <dl className="mb-8" key={key.slug}>
        <dt className="mb-4 text-sm uppercase tracking-wide">{key.label}</dt>
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
              const filtered = Array.from(optionSearchParams.entries()).filter(([key, value]) => {
                return combinations?.find((combination) => {
                  const option = variants?.find((option) => {
                    return option.options.find((option) => {
                      return option.slug === key && option.label === value
                    })
                  })

                  return option?.slug === value
                })
              })

              console.log({ filtered })

              const existingVariant = variants?.find((variant) => {
                const hasOption = variant.options.find((variantOption) => {
                  return variantOption.slug === optionSlug
                })

                return hasOption
              })

              console.log({ existingVariant })

              const isAvailableForSale = Boolean(existingVariant?.id && existingVariant?.stock > 0)

              // The option is active if it's in the url params.
              const isActive =
                Boolean(isAvailableForSale) && searchParams.get(optionKeyLowerCase) === option.slug

              return (
                <button
                  aria-disabled={!isAvailableForSale}
                  className={clsx(
                    'flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900',
                    {
                      'cursor-default ring-2 ring-blue-600': isActive,
                      'relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 before:dark:bg-neutral-700':
                        !isAvailableForSale,
                      'ring-1 ring-transparent transition duration-300 ease-in-out hover:scale-110 hover:ring-blue-600 ':
                        !isActive && isAvailableForSale,
                    },
                  )}
                  disabled={!isAvailableForSale}
                  key={option.slug}
                  onClick={() => {
                    router.replace(`${optionUrl}&variant=${existingVariant?.id}`, {
                      scroll: false,
                    })
                  }}
                  title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                  type="button"
                >
                  {option.label}
                </button>
              )
            })}
          </React.Fragment>
        </dd>
      </dl>
    )
  })
}
