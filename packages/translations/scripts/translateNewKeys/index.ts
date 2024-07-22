/* eslint no-console: 0 */

import fs from 'fs'
import path from 'path'
import { format } from 'prettier'

import type {
  AcceptedLanguages,
  GenericLanguages,
  GenericTranslationsObject,
} from '../../src/types.js'

import { deepMergeSimple } from '../../src/utilities/deepMergeSimple.js'
import { acceptedLanguages } from '../../src/utilities/languages.js'
import { applyEslintFixes } from './applyEslintFixes.js'
import { findMissingKeys } from './findMissingKeys.js'
import { generateTsObjectLiteral } from './generateTsObjectLiteral.js'
import { sortKeys } from './sortKeys.js'
import { translateText } from './translateText.js'

/**
 *
 * props.allTranslationsObject:
 * @Example
 * ```ts
 * {
 *   en: {
 *     lexical: {
 *       link: {
 *         editLink: 'Edit link',
 *         invalidURL: 'Invalid URL',
 *         removeLink: 'Remove link',
 *       },
 *     },
 *   },
 *   de: {
 *     lexical: {
 *       // ...
 *     }
 *   },
 *   // ...
 * }
 *```
 *
 * @param props
 */
export async function translateObject(props: {
  allTranslationsObject: {
    [key in AcceptedLanguages]?: {
      dateFNSKey: string
      translations: GenericTranslationsObject
    }
  }
  fromTranslationsObject: GenericTranslationsObject
  /**
   *
   * If set, will output the entire translations object (incl. all locales) to this file.
   *
   * @default false
   */
  inlineFile?: string
  languages?: AcceptedLanguages[]
  targetFolder?: string
  tsFilePrefix?: string
  tsFileSuffix?: string
}) {
  const {
    allTranslationsObject,
    fromTranslationsObject,
    inlineFile,
    languages = acceptedLanguages.filter((lang) => lang !== 'en'),
    targetFolder = '',
    tsFilePrefix = `import type { DefaultTranslationsObject, Language } from '../types.js'\n\nexport const {{locale}}Translations: DefaultTranslationsObject = `,
    tsFileSuffix = `\n\nexport const {{locale}}: Language = {
  dateFNSKey: {{dateFNSKey}},
  translations: {{locale}}Translations,
}  `,
  } = props

  const allTranslatedTranslationsObject: {
    [key in AcceptedLanguages]?: {
      dateFNSKey: string
      translations: GenericTranslationsObject
    }
  } = JSON.parse(JSON.stringify(allTranslationsObject))
  const allOnlyNewTranslatedTranslationsObject: GenericLanguages = {}

  const translationPromises: Promise<void>[] = []

  for (const targetLang of languages) {
    if (!allTranslatedTranslationsObject?.[targetLang]) {
      allTranslatedTranslationsObject[targetLang] = {
        dateFNSKey: targetLang,
        translations: {},
      }
    }
    const keysWhichDoNotExistInFromlang = findMissingKeys(
      allTranslatedTranslationsObject?.[targetLang].translations,
      fromTranslationsObject,
    )
    console.log(`Keys which do not exist in English:`, keysWhichDoNotExistInFromlang)
    /**
     * If a key does not exist in the fromTranslationsObject, it should be deleted from the target language object
     */
    for (const key of keysWhichDoNotExistInFromlang) {
      // Delete those keys in the target language object obj[lang]
      const keys = key.split('.')
      let targetObj = allTranslatedTranslationsObject?.[targetLang].translations
      for (let i = 0; i < keys.length - 1; i += 1) {
        const nextObj = targetObj[keys[i]]
        if (typeof nextObj !== 'object') {
          throw new Error(`Key ${keys[i]} is not an object in ${targetLang} (1)`)
        }
        targetObj = nextObj
      }
      delete targetObj[keys[keys.length - 1]]
    }

    if (!allTranslatedTranslationsObject?.[targetLang].translations) {
      allTranslatedTranslationsObject[targetLang].translations = {}
    }
    const missingKeys = findMissingKeys(
      fromTranslationsObject,
      allTranslatedTranslationsObject?.[targetLang].translations,
    )

    console.log('Missing keys for lang', targetLang, ':', missingKeys)

    for (const missingKey of missingKeys) {
      const keys: string[] = missingKey.split('.')
      const sourceText = keys.reduce((acc, key) => acc[key], fromTranslationsObject)
      if (!sourceText || typeof sourceText !== 'string') {
        throw new Error(
          `Missing key ${missingKey} or key not "leaf" in fromTranslationsObject for lang ${targetLang}. (2)`,
        )
      }

      if (translationPromises.length >= 12) {
        // Wait for one of the promises to resolve before adding a new one
        await Promise.race(translationPromises)
      }

      translationPromises.push(
        translateText(sourceText, targetLang).then((translated) => {
          if (!allOnlyNewTranslatedTranslationsObject[targetLang]) {
            allOnlyNewTranslatedTranslationsObject[targetLang] = {}
          }
          let targetObj = allOnlyNewTranslatedTranslationsObject?.[targetLang]
          for (let i = 0; i < keys.length - 1; i += 1) {
            if (!targetObj[keys[i]]) {
              targetObj[keys[i]] = {}
            }
            const nextObj = targetObj[keys[i]]
            if (typeof nextObj !== 'object') {
              throw new Error(`Key ${keys[i]} is not an object in ${targetLang} (3)`)
            }
            targetObj = nextObj
          }
          targetObj[keys[keys.length - 1]] = translated

          allTranslatedTranslationsObject[targetLang].translations = sortKeys(
            deepMergeSimple(
              allTranslatedTranslationsObject[targetLang].translations,
              allOnlyNewTranslatedTranslationsObject[targetLang],
            ),
          )
        }),
      )
    }
  }

  //await Promise.all(translationPromises)
  for (const promise of translationPromises) {
    await promise
  }

  // merge with existing translations
  console.log('Merged object:', allTranslatedTranslationsObject)

  console.log('New translations:', allOnlyNewTranslatedTranslationsObject)

  if (inlineFile?.length) {
    const simpleTranslationsObject = {}
    for (const lang in allTranslatedTranslationsObject) {
      simpleTranslationsObject[lang] = allTranslatedTranslationsObject[lang].translations
    }

    // write allTranslatedTranslationsObject
    const filePath = path.resolve(inlineFile)
    let fileContent: string = `${tsFilePrefix}${generateTsObjectLiteral(simpleTranslationsObject)}\n`

    // suffix
    fileContent += `${tsFileSuffix}\n`

    // eslint
    fileContent = await applyEslintFixes(fileContent, filePath)

    // prettier
    fileContent = await format(fileContent, {
      parser: 'typescript',
      printWidth: 100,
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
    })

    fs.writeFileSync(filePath, fileContent, 'utf8')
  } else {
    // save

    for (const key of languages) {
      // e.g. sanitize rs-latin to rsLatin
      const sanitizedKey = key.replace(
        /-(\w)(\w*)/g,
        (_, firstLetter, remainingLetters) =>
          firstLetter.toUpperCase() + remainingLetters.toLowerCase(),
      )
      const filePath = path.resolve(targetFolder, `${sanitizedKey}.ts`)

      // prefix & translations
      let fileContent: string = `${tsFilePrefix.replace('{{locale}}', sanitizedKey)}${generateTsObjectLiteral(allTranslatedTranslationsObject[key].translations)}\n`

      // suffix
      fileContent += `${tsFileSuffix.replaceAll('{{locale}}', sanitizedKey).replaceAll('{{dateFNSKey}}', `'${allTranslatedTranslationsObject[key].dateFNSKey}'`)}\n`

      // eslint
      fileContent = await applyEslintFixes(fileContent, filePath)

      // prettier
      fileContent = await format(fileContent, {
        parser: 'typescript',
        printWidth: 100,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
      })

      fs.writeFileSync(filePath, fileContent, 'utf8')
    }
  }

  return allTranslatedTranslationsObject
}
