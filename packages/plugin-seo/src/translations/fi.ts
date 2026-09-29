import type { GenericTranslationsObject } from '@payloadcms/translations'

export const fi: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Melkein valmista',
    autoGenerate: 'Generoi automaattisesti',
    bestPractices: 'parhaat käytännöt',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} merkkiä, ',
    charactersLeftOver: '{{characters}} jäljellä',
    charactersToGo: '{{characters}} lisättävä',
    charactersTooMany: '{{characters}} liikaa',
    checksPassing: '{{current}}/{{max}} tarkistusta menee läpi',
    good: 'Hyvä',
    imageAutoGenerationTip: 'Automaattinen generointi hakee valitun hero-kuvan.',
    lengthTipDescription:
      'Tämän tulisi olla {{minLength}}-{{maxLength}} merkkiä. Lisätietoja laadukkaiden meta-kuvauksien kirjoittamisesta löytyy täältä ',
    lengthTipTitle:
      'Tämän tulisi olla {{minLength}}-{{maxLength}} merkkiä. Lisätietoja laadukkaiden meta-otsikkojen kirjoittamisesta löytyy täältä ',
    missing: 'Puuttuu',
    noImage: 'Ei kuvaa',
    preview: 'Esikatselu',
    previewDescription:
      'Tuloslistaukset voivat vaihdella sisällön ja haun relevanssin perusteella.',
    tooLong: 'Liian pitkä',
    tooShort: 'Liian lyhyt',
  },
}
