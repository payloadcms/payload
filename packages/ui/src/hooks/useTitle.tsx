import type { SanitizedCollectionConfig, SanitizedGlobalConfig, ClientConfig } from 'payload/types'

import { useFormFields } from '../forms/Form/context'
import { formatDocTitle } from '../utilities/formatDocTitle'

// Keep `collection` optional so that component do need to worry about conditionally rendering hooks
// This is so that components which take both `collection` and `global` props can use this hook
const useTitle = (args: {
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
}): string => {
  const { useAsTitle, globalLabel, globalSlug } = args
  // const { i18n } = useTranslation()

  let title: string = ''

  const field = useFormFields(([formFields]) => formFields[useAsTitle])

  if (useAsTitle) {
    title = formatDocTitle({
      useAsTitle,
      field,
      // i18n
    })
  }

  if (globalLabel) {
    title = typeof globalLabel === 'string' ? globalLabel : globalSlug
    // title = getTranslation(globalLabel, i18n) || globalSlug
  }

  return title
}

export default useTitle
