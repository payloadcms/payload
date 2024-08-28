import type { ClientTranslationKeys, TFunction } from '@payloadcms/translations'

import * as React from 'react'

const RecursiveTranslation: React.FC<{
  elements?: Record<string, React.FC<{ children: React.ReactNode }>>
  translationString: string
}> = ({ elements, translationString }) => {
  const regex = /(<[^>]+>.*?<\/[^>]+>)/g
  const sections = translationString.split(regex)

  return (
    <span>
      {sections.map((section, index) => {
        if (elements && section.startsWith('<') && section.endsWith('>')) {
          const elementKey = section[1]
          const Element = elements[elementKey]

          if (Element) {
            const regex = new RegExp(`<${elementKey}>(.*?)<\/${elementKey}>`, 'g')
            const children = section.replace(regex, (_, group) => group)

            return (
              <Element key={index}>
                <RecursiveTranslation translationString={children} />
              </Element>
            )
          }
        }

        return section
      })}
    </span>
  )
}

export type TranslationProps = {
  elements?: Record<string, React.FC<{ children: React.ReactNode }>>
  i18nKey: ClientTranslationKeys
  t: TFunction
  variables?: Record<string, unknown>
}

export const Translation: React.FC<TranslationProps> = ({ elements, i18nKey, t, variables }) => {
  const stringWithVariables = t(i18nKey, variables || {})

  if (!elements) {
    return stringWithVariables
  }

  return <RecursiveTranslation elements={elements} translationString={stringWithVariables} />
}
