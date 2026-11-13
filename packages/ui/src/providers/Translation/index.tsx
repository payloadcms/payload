'use client'
import React from 'react'

import type { TranslationContextProviderProps } from './Context/index.js'

import { useRouter } from '../RouterAdapter/index.js'
import { useServerFunctions } from '../ServerFunctions/index.js'
import { TranslationContextProvider } from './Context/index.js'

export { useTranslation } from './Context/index.js'

type Props = Omit<TranslationContextProviderProps, 'onLanguageChange'>

export const TranslationProvider: React.FC<Props> = (props) => {
  const router = useRouter()
  const { switchLanguage: switchLanguageServerFn } = useServerFunctions()

  const switchLanguage = React.useCallback(
    async (lang: string) => {
      try {
        await switchLanguageServerFn(lang)
        router.refresh()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error loading language: "${lang}"`, error)
      }
    },
    [switchLanguageServerFn, router],
  )

  return <TranslationContextProvider {...props} onLanguageChange={switchLanguage} />
}
