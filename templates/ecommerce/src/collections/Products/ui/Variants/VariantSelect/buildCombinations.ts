import { Product } from '@/payload-types'
type Output = { options: { slug: string; value: string }[] }[]

export const generateCombinations = (
  variantGroups: NonNullable<Product['variantOptions']>,
): Output => {
  return variantGroups
    .filter((group) => {
      return Array.isArray(group?.options) && group.options?.length > 0
    })
    .map((group) => {
      return group.options!.map((option) => ({ slug: group.slug, value: option.slug }))
    })
    .reduce((acc, options) => {
      if (acc.length === 0) return options.map((option) => ({ options: [option] }))
      return acc.flatMap((existing) =>
        options.map((option) => ({ options: [...existing.options, option] })),
      )
    }, [] as Output)
}

export function mergeVariants(
  combinations: Output,
  existingVariants: NonNullable<Product['variants']>,
): NonNullable<Product['variants']> {
  // Create a map of existing variants by their unique key (options combination)
  const existingMap = new Map<string, NonNullable<Product['variants']>[number]>()

  if (Array.isArray(existingVariants) && existingVariants.length) {
    existingVariants.forEach((variant) => {
      const key = variant.options.map((o) => `${o.slug}:${o.value}`).join('-')
      existingMap.set(key, variant)
    })
  }

  return combinations.map(({ options }) => {
    const key = options.map((o) => `${o.slug}:${o.value}`).join('-')

    let existingVariant = existingMap.get(key)

    if (!existingVariant) {
      // Try to find a partial match
      let bestMatch: NonNullable<Product['variants']>[number] | null = null
      let bestMatchCount = 0

      for (const [existingKey, variant] of existingMap.entries()) {
        const existingParts = new Set(existingKey.split('-'))
        const matchCount = options.filter((o) => existingParts.has(`${o.slug}:${o.value}`)).length

        if (matchCount > bestMatchCount) {
          bestMatch = variant
          bestMatchCount = matchCount
        }
      }

      existingVariant = bestMatch ?? undefined
    }

    return existingVariant
      ? { ...existingVariant, options }
      : { options, price: 0, stock: 0, active: true }
  })
}
