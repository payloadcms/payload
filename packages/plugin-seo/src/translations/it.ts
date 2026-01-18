import type { GenericTranslationsObject } from '@payloadcms/translations'

export const it: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Ci siamo quasi',
    autoGenerate: 'Generazione automatica',
    bestPractices: 'migliori pratiche',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caratteri, ',
    charactersLeftOver: '{{characters}} rimasti',
    charactersToGo: '{{characters}} mancanti',
    charactersTooMany: '{{characters}} in più',
    checksPassing: '{{current}}/{{max}} controlli superati',
    good: 'Bene',
    imageAutoGenerationTip:
      "La generazione automatica recupererà l'immagine selezionata per l'hero",
    lengthTipDescription:
      'Dovrebbe essere compreso tra {{minLength}} e {{maxLength}} caratteri. Per assistenza nella scrittura di meta descrizioni di qualità, vedere ',
    lengthTipTitle:
      'Dovrebbe essere compreso tra {{minLength}} e {{maxLength}} caratteri. Per assistenza nella scrittura di meta titoli di qualità, vedere ',
    missing: 'Mancante',
    noImage: 'Nessuna Immagine',
    preview: 'Anteprima',
    previewDescription:
      'I risultati esatti possono variare in base al contenuto e alla pertinenza della ricerca.',
    tooLong: 'Troppo lungo',
    tooShort: 'Troppo corto',
  },
}
