import type { GenericTranslationsObject } from '@payloadcms/translations'

export const de: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Fast da',
    autoGenerate: 'Automatisch generieren',
    bestPractices: 'Best Practices',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} Zeichen, ',
    charactersLeftOver: '{{characters}} verbleiben',
    charactersToGo: '{{characters}} übrig',
    charactersTooMany: '{{characters}} zu viel',
    checksPassing: '{{current}}/{{max}} Kontrollen erfolgreich',
    good: 'Gut',
    imageAutoGenerationTip: 'Die automatische Generierung ruft das ausgewählte Hauptbild ab.',
    lengthTipDescription:
      'Diese sollte zwischen {{minLength}} und {{maxLength}} Zeichen lang sein. Für Hilfe beim Schreiben von qualitativ hochwertigen Meta-Beschreibungen siehe ',
    lengthTipTitle:
      'Dieser sollte zwischen {{minLength}} und {{maxLength}} Zeichen lang sein. Für Hilfe beim Schreiben von qualitativ hochwertigen Meta-Titeln siehe ',
    missing: 'Fehlt',
    noImage: 'Kein Bild',
    preview: 'Vorschau',
    previewDescription:
      'Die genauen Ergebnislisten können je nach Inhalt und Suchrelevanz variieren.',
    tooLong: 'Zu lang',
    tooShort: 'Zu kurz',
  },
}
