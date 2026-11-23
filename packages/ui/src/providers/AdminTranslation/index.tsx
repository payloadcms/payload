'use client'
import React from 'react'

import type { TranslationProviderProps } from '../Translation/index.js'

import { useRouter } from '../RouterAdapter/index.js'
import { useServerFunctions } from '../ServerFunctions/index.js'
import { TranslationProvider } from '../Translation/index.js'

type Props = Omit<TranslationProviderProps, 'onLanguageChange'>

export const AdminTranslationProvider: React.FC<Props> = (props) => {
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

  return <TranslationProvider {...props} onLanguageChange={switchLanguage} />
}
