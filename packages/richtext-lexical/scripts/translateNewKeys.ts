import type {
  AcceptedLanguages,
  GenericLanguages,
  GenericTranslationsObject,
} from '@payloadcms/translations'

import * as fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { translateObject } from '../../translations/scripts/translateNewKeys/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Function to get all files with a specific name recursively in all subdirectories
function findFilesRecursively(startPath, filter) {
  let results = []

  const entries = fs.readdirSync(startPath, { withFileTypes: true })

  entries.forEach((dirent) => {
    const fullPath = path.join(startPath, dirent.name)

    if (dirent.isDirectory()) {
      results = results.concat(findFilesRecursively(fullPath, filter))
    } else {
      if (dirent.name === filter) {
        results.push(fullPath)
      }
    }
  })

  return results
}

const i18nFilePaths = findFilesRecursively(path.resolve(dirname, '../src'), 'i18n.ts')

async function translate() {
  for (const i18nFilePath of i18nFilePaths) {
    const imported = await import(i18nFilePath)
    const translationsObject = imported.i18n as Partial<GenericLanguages>
    const allTranslations: {
      [key in AcceptedLanguages]?: {
        dateFNSKey: string
        translations: GenericTranslationsObject
      }
    } = {}
    for (const lang in translationsObject) {
      allTranslations[lang] = {
        dateFNSKey: 'en',
        translations: translationsObject[lang],
      }
    }

    console.log('Translating', i18nFilePath)
    await translateObject({
      allTranslationsObject: allTranslations,
      fromTranslationsObject: translationsObject.en,
      inlineFile: i18nFilePath,
      tsFilePrefix: `import { GenericLanguages } from '@payloadcms/translations'

export const i18n: Partial<GenericLanguages> = `,
      tsFileSuffix: ``,
    })
  }
}

void translate()
