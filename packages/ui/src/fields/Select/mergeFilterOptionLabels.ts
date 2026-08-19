import type { Option, OptionObject } from 'payload'

export const mergeFilterOptionLabels = ({
  options,
  selectFilterOptions,
}: {
  options: OptionObject[]
  selectFilterOptions: Option[] | undefined
}): OptionObject[] => {
  if (!selectFilterOptions) {
    return options
  }

  const labelsFromFilterOptions = new Map<string, OptionObject['label']>()

  for (const filterOption of selectFilterOptions) {
    if (typeof filterOption === 'object') {
      labelsFromFilterOptions.set(filterOption.value, filterOption.label)
    }
  }

  return options.map((option) => {
    const labelFromFilterOptions = labelsFromFilterOptions.get(option.value)

    return labelFromFilterOptions === undefined
      ? option
      : { ...option, label: labelFromFilterOptions }
  })
}
