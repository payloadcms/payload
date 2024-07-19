import type { Option } from 'payload'
import { getTranslation, I18nClient, TFunction } from '@payloadcms/translations'
import { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

export function getSelectedOptionLabels({
  selectedOptions,
  options,
  i18n,
}: {
  selectedOptions: string[]
  options: Option[]
  i18n: I18nClient
}): string[] {
  const selectLabels = selectedOptions.reduce((acc, selectedOption) => {
    options.forEach((option) => {
      if (typeof option === 'string') {
        if (option === selectedOption) acc.push(getTranslation(option, i18n))
      } else if ('options' in option) {
        acc = [
          ...acc,
          ...getSelectedOptionLabels({ selectedOptions, options: option.options, i18n }),
        ]
      } else if (option.value === selectedOption) {
        acc.push(getTranslation(option.label, i18n))
      }
    })

    return acc
  }, [])

  return [...new Set(selectLabels)]
}

export const buildReactSelectOptions = ({
  options,
  i18n,
}: {
  options: Option[]
  i18n: I18nClient
}): ReactSelectAdapterProps['options'] => {
  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        label: getTranslation(option, i18n),
        value: option,
      }
    } else if ('options' in option) {
      return {
        label: getTranslation(option.label, i18n),
        options: buildReactSelectOptions({
          options: option.options,
          i18n,
        }),
      } as any
    } else {
      return {
        label: getTranslation(option.label, i18n),
        value: option.value,
      }
    }
  })
}

function getReactSelectValues({
  values,
  options,
  i18n,
}: {
  values: string[]
  options: Option[]
  i18n: I18nClient
}): ReactSelectAdapterProps['value'] {
  return values.reduce((acc, selectedOption) => {
    options.forEach((option) => {
      if (typeof option === 'string') {
        if (option === selectedOption)
          acc.push({
            label: getTranslation(option, i18n),
            value: option,
          })
      } else if ('options' in option) {
        const subOptions = getReactSelectValues({
          values: [selectedOption],
          options: option.options,
          i18n,
        })
        if (subOptions.length) {
          acc = [...acc, ...(Array.isArray(subOptions) ? subOptions : [subOptions])]
        }
      } else if (option.value === selectedOption) {
        acc.push({
          label: getTranslation(option.label, i18n),
          value: option.value,
        })
      }
    })

    return acc
  }, [])
}

export const buildReactSelectValues = ({
  options,
  values,
  i18n,
}: {
  options: Option[]
  values: string[]
  i18n: I18nClient
}): ReactSelectAdapterProps['value'] => {
  const nonUniqueValues = getReactSelectValues({ values, options, i18n })
  return [...new Set(Array.isArray(nonUniqueValues) ? nonUniqueValues : [nonUniqueValues])]
}

export const sanitizeServerSideOptions = ({
  options,
  t,
}: {
  options: Option[]
  t: TFunction
}): Option[] => {
  function createOptionLabel(option: Option) {
    if (typeof option === 'object' && typeof option.label === 'function') {
      return option.label({ t })
    }
    return typeof option === 'string' ? option : option.label
  }

  function generateOptions(options: Option[]) {
    return options.map((option) => {
      if (typeof option === 'string') {
        return {
          label: option,
          value: option,
        }
      } else if ('options' in option) {
        return {
          label: createOptionLabel(option),
          options: generateOptions(option.options),
        }
      } else {
        return {
          label: createOptionLabel(option),
          value: option.value,
        }
      }
    })
  }

  return generateOptions(options)
}
