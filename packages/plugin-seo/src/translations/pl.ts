import type { GenericTranslationsObject } from '@payloadcms/translations'

export const pl: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Prawie gotowe',
    autoGenerate: 'Wygeneruj automatycznie',
    bestPractices: 'najlepsze praktyki',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} znaków, ',
    charactersLeftOver: 'zostało {{characters}} znaków',
    charactersToGo: 'pozostało {{characters}} znaków',
    charactersTooMany: '{{characters}} znaków za dużo',
    checksPassing: '{{current}}/{{max}} testów zakończonych pomyślnie',
    good: 'Dobrze',
    imageAutoGenerationTip: 'Automatyczne generowanie pobierze wybrany główny obraz.',
    lengthTipDescription:
      'Długość powinna wynosić od {{minLength}} do {{maxLength}} znaków. Po porady dotyczące pisania wysokiej jakości meta opisów zobacz ',
    lengthTipTitle:
      'Długość powinna wynosić od {{minLength}} do {{maxLength}} znaków. Po porady dotyczące pisania wysokiej jakości meta tytułów zobacz ',
    missing: 'Brakuje',
    noImage: 'Brak obrazu',
    preview: 'Podgląd',
    previewDescription:
      'Dokładne wyniki listowania mogą się różnić w zależności od treści i zgodności z kryteriami wyszukiwania.',
    tooLong: 'Zbyt długie',
    tooShort: 'Zbyt krótkie',
  },
}
