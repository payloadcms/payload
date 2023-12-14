import { deepMerge } from 'payload/utilities'

const OPENAI_API_KEY = 'sk-YOURKEYHERE' // Remember to replace with your actual key

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

  const data = await response.json()
  console.log('  Old text:', text, 'New text:', data.choices[0].message.content.trim())
  return data.choices[0].message.content.trim()
}

function findMissingKeys(baseObj: any, targetObj: any, prefix = ''): string[] {
  let missingKeys = []

  for (const key in baseObj) {
    if (typeof baseObj[key] === 'object') {
      missingKeys = missingKeys.concat(
        findMissingKeys(baseObj[key], targetObj[key] || {}, `${prefix}${key}.`),
      )
    } else if (!(key in targetObj)) {
      missingKeys.push(`${prefix}${key}`)
    }
  }

  return missingKeys
}

const findKeysWhichDontExistInEnglish = (baseObj: any, targetObj: any, prefix = ''): string[] => {
  let keysWhichDoNotExistInBaseObj = []
  for (const key in targetObj) {
    if (typeof targetObj[key] === 'object') {
      keysWhichDoNotExistInBaseObj = keysWhichDoNotExistInBaseObj.concat(
        findKeysWhichDontExistInEnglish(baseObj[key], targetObj[key] || {}, `${prefix}${key}.`),
      )
    } else if (!(key in baseObj)) {
      keysWhichDoNotExistInBaseObj.push(`${prefix}${key}`)
    }
  }

  return keysWhichDoNotExistInBaseObj
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
 * @param obj Object of type "Resource" with all the languages
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
 *       ...
 *     }
 *   },
 *   ...
 * }
 *
 * @param languages Full Resource object without en language
 */
export async function translateObject(obj: any, languages?: string[]) {
  if (!languages) {
    languages = [
      'ar',
      'az',
      'bg',
      'cs',
      'de',
      'en',
      'es',
      'fa',
      'fr',
      'hr',
      'hu',
      'it',
      'ja',
      'ko',
      'my',
      'nb',
      'nl',
      'pl',
      'pt',
      'ro',
      'rs',
      'rsLatin',
      'ru',
      'sv',
      'th',
      'tr',
      'ua',
      'vi',
      'zh',
      'zhTw',
    ]
  }
  const translatedObject = {}
  const translationPromises: Promise<any>[] = []

  for (const lang of languages) {
    const keysWhichDoNotExistInEnglish = findKeysWhichDontExistInEnglish(obj?.en, obj?.[lang])
    console.log('Keys which do not exist in English:', keysWhichDoNotExistInEnglish)
    for (const key of keysWhichDoNotExistInEnglish) {
      // Delete those keys in the target language object obj[lang]
      const keys = key.split('.')
      let targetObj = obj?.[lang]
      for (let i = 0; i < keys.length - 1; i += 1) {
        targetObj = targetObj[keys[i]]
      }
      delete targetObj[keys[keys.length - 1]]
    }

    if (!obj?.[lang]) {
      obj[lang] = {}
    }
    const missingKeys = findMissingKeys(obj?.en, obj?.[lang])

    console.log('Missing keys for lang', lang, ':', missingKeys)

    for (const missingKey of missingKeys) {
      const keys = missingKey.split('.')
      const sourceText = keys.reduce((acc, key) => acc[key], obj['en'])
      if (translationPromises.length >= 12) {
        // Wait for one of the promises to resolve before adding a new one
        await Promise.race(translationPromises)
      }

      translationPromises.push(
        translateText(sourceText, lang).then((translated) => {
          if (!translatedObject[lang]) {
            translatedObject[lang] = {}
          }
          let targetObj = translatedObject?.[lang]
          for (let i = 0; i < keys.length - 1; i += 1) {
            if (!targetObj[keys[i]]) {
              targetObj[keys[i]] = {}
            }
            targetObj = targetObj[keys[i]]
          }
          targetObj[keys[keys.length - 1]] = translated
        }),
      )
    }
  }

  await Promise.all(translationPromises)

  // merge with existing translation.json
  const mergedObject = deepMerge(obj, translatedObject)
  console.log('Merged object:', mergedObject)

  console.log('New translations:', translatedObject)

  // save to translation.json (create if not exists
  const fs = require('fs')
  const path = require('path')

  const filePath = path.resolve(__dirname, '../translation.json')
  // now save translatedObject
  const json = JSON.stringify(mergedObject, null, 2)
  fs.writeFileSync(filePath, json, 'utf8')

  return mergedObject
}
