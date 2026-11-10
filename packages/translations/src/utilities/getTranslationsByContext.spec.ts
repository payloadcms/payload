import { describe, expect, it } from 'vitest'

import { en } from '../languages/en.js'
import { fr } from '../languages/fr.js'
import { initI18n } from './init.js'

describe('preview admin translations', () => {
  it.each([
    {
      language: 'en' as const,
      title: 'Collection Preview',
      upload: 'Add files',
      hint: 'or drag and drop a file here',
    },
    {
      language: 'fr' as const,
      title: 'Aperçu de la collection',
      hint: 'ou glissez-déposez un fichier ici',
      upload: 'Ajouter des fichiers',
    },
  ])(
    'should resolve preview labels in the $language admin context',
    async ({ language, upload, hint, title }) => {
      const i18n = await initI18n({
        config: { fallbackLanguage: 'en', supportedLanguages: { en, fr } },
        context: 'client',
        language,
      })

      expect(i18n.t('dashboard:widgetCollectionPreview')).toBe(title)
      expect(i18n.t('upload:addFiles')).toBe(upload)
      expect(i18n.t('upload:dragAndDropHere')).toBe(hint)
    },
  )
})
