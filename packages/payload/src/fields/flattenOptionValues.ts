import { Option } from './config/types.js'

export function flattenOptionValues(options: Option[]): string[] {
  return options.reduce<string[]>((acc, option) => {
    if (typeof option === 'string') {
      acc.push(option)
    } else if ('options' in option) {
      acc.push(...flattenOptionValues(option.options))
    } else {
      acc.push(option.value)
    }

    return acc
  }, [])
}
