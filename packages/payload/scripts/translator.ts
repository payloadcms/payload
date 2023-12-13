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

async function recursivelyTranslate(obj, targetLanguage) {
  if (typeof obj === 'object' && obj !== null) {
    const translated = Array.isArray(obj) ? [] : {}
    for (const key in obj) {
      translated[key] = await recursivelyTranslate(obj[key], targetLanguage)
    }
    return translated
  } else if (typeof obj === 'string') {
    return await translateText(obj, targetLanguage)
  } else {
    return obj
  }
}

/**
 *
 * @param obj Object of type "Resource" but without the language as first property. English is assumed. Example:
 * {
 *   lexical: {
 *     link: {
 *       editLink: 'Edit link',
 *       invalidURL: 'Invalid URL',
 *       removeLink: 'Remove link',
 *     },
 *   },
 * }
 *
 * @param languages Full Resource object without en language
 */
export async function translateObject(obj: object, languages?: string[]) {
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
      'rs-latin',
      'su',
      'sv',
      'th',
      'tr',
      'ua',
      'vi',
      'zh',
      'zh-tw',
    ]
  }
  const translatedObject = {}
  for (const lang of languages) {
    const translationPromises = []

    // Function to add promises to the array, maintaining a maximum of 12 concurrent translations
    async function addTranslationPromise(key, value) {
      if (translationPromises.length >= 12) {
        // Wait for one of the promises to resolve before adding a new one
        await Promise.race(translationPromises)
      }
      const translationPromise = recursivelyTranslate(value, lang).then((translatedValue) => {
        return { key, translatedValue }
      })
      translationPromises.push(translationPromise)
    }

    // Collect all translation promises
    async function collectTranslations(currentObj, path = []) {
      if (typeof currentObj === 'object' && currentObj !== null) {
        for (const key in currentObj) {
          await collectTranslations(currentObj[key], path.concat(key))
        }
      } else if (typeof currentObj === 'string') {
        await addTranslationPromise(path, currentObj)
      }
    }

    await collectTranslations(obj)

    // Wait for all translations to complete
    const results = await Promise.all(translationPromises)

    // Construct the translated object
    results.forEach(({ key, translatedValue }) => {
      const target = translatedObject[lang] || {}
      let current = target
      key.slice(0, -1).forEach((k) => {
        current[k] = current[k] || {}
        current = current[k]
      })
      current[key[key.length - 1]] = translatedValue
      translatedObject[lang] = target
    })
  }

  console.log('Translated object:', translatedObject)

  // save to translation.json (create if not exists
  const fs = require('fs')
  const path = require('path')

  const filePath = path.resolve(__dirname, '../translation.json')
  // now save translatedObject
  const json = JSON.stringify(translatedObject)
  fs.writeFileSync(filePath, json, 'utf8')

  return translatedObject
}
