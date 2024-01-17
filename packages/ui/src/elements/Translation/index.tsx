import * as React from 'react'
import { TFunction } from '@payloadcms/translations'

const RecursiveTranslation: React.FC<{
  translationString: string
  elements?: Record<string, React.FC<{ children: React.ReactNode }>>
}> = ({ translationString, elements }) => {
  const regex = /(<[^>]+>.*?<\/[^>]+>)/g
  const sections = translationString.split(regex)

  return (
    <span>
      {sections.map((section, index) => {
        const Element = elements?.[index.toString()]
        if (Element) {
          const regex = new RegExp(`<${index}>(.*?)<\/${index}>`, 'g')
          const children = section.replace(regex, (_, group) => group)
          return (
            <Element key={index}>
              <RecursiveTranslation translationString={children} />
            </Element>
          )
        }
        return section
      })}
    </span>
  )
}

type TranslationProps = {
  i18nKey: string
  variables?: Record<string, unknown>
  elements?: Record<string, React.FC<{ children: React.ReactNode }>>
  t: TFunction
}
export const Translation: React.FC<TranslationProps> = ({ elements, variables, i18nKey, t }) => {
  let stringWithVariables = t(i18nKey, variables || {})

  if (!elements) {
    return stringWithVariables
  }

  return <RecursiveTranslation translationString={stringWithVariables} elements={elements} />
}
