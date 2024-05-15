import fs from 'fs'
import path from 'path'
import { format } from 'prettier'
import { fileURLToPath } from 'url'

import type {
  AcceptedLanguages,
  GenericLanguages,
  GenericTranslationsObject,
} from '../src/types.js'

import { translations } from '../src/exports/all.js'
import { enTranslations } from '../src/languages/en.js'
import { cloneDeep } from '../src/utilities/cloneDeep.js'
import { deepMerge } from '../src/utilities/deepMerge.js'
import { acceptedLanguages } from '../src/utilities/languages.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const OPENAI_API_KEY = 'sk-' // Remember to replace with your actual key

import { ESLint } from 'eslint'

async function applyEslintFixes(text: string, filePath: string): Promise<string> {
  const eslint = new ESLint({ fix: true })
  const results = await eslint.lintText(text, { filePath })
  const result = results[0] || { output: text }
  return result.output || text // Return the fixed content or the original if no fixes were made.
}

function generateTsObjectLiteral(obj: any): string {
  const lines = []
  const entries = Object.entries(obj)
  for (const [key, value] of entries) {
    const safeKey = /^[\w$]+$/.test(key) ? key : JSON.stringify(key)
    const line =
      typeof value === 'object' && value !== null
        ? `${safeKey}: ${generateTsObjectLiteral(value)}`
        : `${safeKey}: ${JSON.stringify(value)}`
    lines.push(line)
  }
  return `{\n  ${lines.join(',\n  ')}\n}`
}

async function translateText(text: string, targetLang: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    body: JSON.stringify({
      max_tokens: 150,
      messages: [
        {
          content: `Only respond with the translation of the text you receive. The original language is English and the translation language is ${targetLang}. Only respond with the translation - do not say anything else. If you cannot translate the text, respond with "[SKIPPED]"`,
          role: 'system',
        },
        {
          content: text,
          role: 'user',
        },
      ],
      model: 'gpt-4',
    }),
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  try {
    const data = await response.json()
    console.log('  Old text:', text, 'New text:', data.choices[0].message.content.trim())
    return data.choices[0].message.content.trim()
  } catch (e) {
    console.error('Error translating:', text, 'to', targetLang, 'response', response, '. Error:', e)
    throw e
  }
}

/**
 * Returns keys which are present in baseObj but not in targetObj
 */
function findMissingKeys(
  baseObj: GenericTranslationsObject,
  targetObj: GenericTranslationsObject,
  prefix = '',
): string[] {
  let missingKeys = []

  for (const key in baseObj) {
    const baseValue = baseObj[key]
    const targetValue = targetObj[key]
    if (typeof baseValue === 'object') {
      missingKeys = missingKeys.concat(
        findMissingKeys(
          baseValue,
          typeof targetValue === 'object' && targetValue ? targetValue : {},
          `${prefix}${key}.`,
        ),
      )
    } else if (!(key in targetObj)) {
      missingKeys.push(`${prefix}${key}`)
    }
  }

  return missingKeys
}

function sortKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj

  if (Array.isArray(obj)) {
    return obj.map(sortKeys)
  }

  const sortedKeys = Object.keys(obj).sort()
  const sortedObj: { [key: string]: any } = {}

  for (const key of sortedKeys) {
    sortedObj[key] = sortKeys(obj[key])
  }

  return sortedObj
}

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
  languages?: AcceptedLanguages[]
  targetFolder?: string
  tsFilePrefix?: string
  tsFileSuffix?: string
}) {
  const {
    // eslint-disable-next-line prefer-const
    allTranslationsObject,
    // eslint-disable-next-line prefer-const
    fromTranslationsObject,
    languages = acceptedLanguages.filter((lang) => lang !== 'en'),
    // eslint-disable-next-line prefer-const
    targetFolder = '',
    // eslint-disable-next-line prefer-const
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
  } = cloneDeep(allTranslationsObject)
  const allOnlyNewTranslatedTranslationsObject: GenericLanguages = {}

  const translationPromises: Promise<any>[] = []

  for (const targetLang of languages) {
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
        targetObj = targetObj[keys[i]]
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
      const keys = missingKey.split('.')
      const sourceText = keys.reduce((acc, key) => acc[key], fromTranslationsObject)
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
            targetObj = targetObj[keys[i]]
          }
          targetObj[keys[keys.length - 1]] = translated

          allTranslatedTranslationsObject[targetLang].translations = sortKeys(
            deepMerge(
              allTranslatedTranslationsObject[targetLang].translations,
              allOnlyNewTranslatedTranslationsObject[targetLang],
            ),
          )
        }),
      )
    }
  }

  await Promise.all(translationPromises)
  /*for (const promise of translationPromises) {
    await promise
  }*/

  // merge with existing translations
  console.log('Merged object:', allTranslatedTranslationsObject)

  console.log('New translations:', allOnlyNewTranslatedTranslationsObject)

  // save

  for (const key of languages) {
    // e.g. sanitize rs-latin to rsLatin
    const sanitizedKey = key.replace(/-([a-z])/gi, (match, group1) => group1.toUpperCase())
    const filePath = path.resolve(dirname, targetFolder, `${sanitizedKey}.ts`)

    // prefix & translations
    let fileContent = `${tsFilePrefix.replace('{{locale}}', sanitizedKey)}${generateTsObjectLiteral(allTranslatedTranslationsObject[key].translations)}\n`

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

  return allTranslatedTranslationsObject
}

const allTranslations: {
  [key in AcceptedLanguages]?: {
    dateFNSKey: string
    translations: GenericTranslationsObject
  }
} = {}

for (const key of Object.keys(translations)) {
  allTranslations[key] = {
    dateFNSKey: translations[key].dateFNSKey,
    translations: translations[key].translations,
  }
}

void translateObject({
  allTranslationsObject: allTranslations,
  fromTranslationsObject: enTranslations,
  languages: ['de'],
  targetFolder: '../src/languages',
})
