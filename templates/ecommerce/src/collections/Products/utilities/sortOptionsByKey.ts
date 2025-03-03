import type { OptionKey, Option } from '../ui/types'

export function sortOptionsByKey(options: OptionKey[], keys: Option[]): OptionKey[] {
  const sortedArray = [...options].sort((a, b) => {
    const aIndex = keys.findIndex((group) => group.values!.some((option) => option.slug === a.slug))

    const bIndex = keys.findIndex((group) => group.values!.some((option) => option.slug === b.slug))

    return aIndex - bIndex
  })

  return sortedArray
}
