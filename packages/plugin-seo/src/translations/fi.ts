import type { GenericTranslationsObject } from '@payloadcms/translations'

export const fi: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Melkein valmis',
    autoGenerate: 'Luo automaattisesti',
    bestPractices: 'parhaat käytännöt',
    characterCount: '{{current}}/{{minLength}}–{{maxLength}} merkkiä, ',
    charactersLeftOver: '{{characters}} käytettävissä',
    charactersToGo: '{{characters}} jäljellä',
    charactersTooMany: '{{characters}} liikaa',
    checksPassing: '{{current}}/{{max}} tarkistusta läpäisty',
    good: 'Hyvä',
    imageAutoGenerationTip: 'Automaattinen luonti hakee pääkuvan.',
    lengthTipDescription:
      'Pituuden tulisi olla {{minLength}}–{{maxLength}} merkkiä. Ohjeita laadukkaiden metakuvausten kirjoittamiseen: ',
    lengthTipTitle:
      'Pituuden tulisi olla {{minLength}}–{{maxLength}} merkkiä. Ohjeita laadukkaiden metaotsikoiden kirjoittamiseen: ',
    missing: 'Puuttuu',
    noImage: 'Ei kuvaa',
    preview: 'Esikatselu',
    previewDescription:
      'Hakutulosten tarkka esitystapa voi vaihdella sisällön ja hakurelevanssin mukaan.',
    tooLong: 'Liian pitkä',
    tooShort: 'Liian lyhyt',
  },
}
