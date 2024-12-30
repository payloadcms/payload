import type { GenericTranslationsObject } from '@payloadcms/translations'

export const cs: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Skoro hotovo',
    autoGenerate: 'Generovat automaticky',
    bestPractices: 'osvědčené postupy',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} znaků, ',
    charactersLeftOver: '{{characters}} zbývá',
    charactersToGo: '{{characters}} zbývá',
    charactersTooMany: '{{characters}} navíc',
    checksPassing: '{{current}}/{{max}} kontrol úspěšně splněno',
    good: 'Dobré',
    imageAutoGenerationTip: 'Automatická generace načte vybraný hero obrázek.',
    lengthTipDescription:
      'Toto by mělo mít mezi {{minLength}} a {{maxLength}} znaky. Pomoc při psaní kvalitních meta popisů navštivte ',
    lengthTipTitle:
      'Toto by mělo mít mezi {{minLength}} a {{maxLength}} znaky. Pomoc při psaní kvalitních meta titulů navštivte ',
    missing: 'Chybí',
    noImage: 'Bez obrázku',
    preview: 'Náhled',
    previewDescription:
      'Přesný výsledek se může lišit v závislosti na obsahu a relevanci vyhledávání.',
    tooLong: 'Příliš dlouhé',
    tooShort: 'Příliš krátké',
  },
}
