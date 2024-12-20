import type { GenericTranslationsObject } from '@payloadcms/translations'

export const el: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Σχεδόν έτοιμο',
    autoGenerate: 'Αυτόματη δημιουργία',
    bestPractices: 'βέλτιστες πρακτικές',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} χαρακτήρες, ',
    charactersLeftOver: 'Περισσεύουν {{characters}} χαρακτήρες',
    charactersToGo: 'Λείπουν {{characters}} χαρακτήρες',
    charactersTooMany: '{{characters}} χαρακτήρες παραπάνω',
    checksPassing: '{{current}}/{{max}} έλεγχοι περνούν',
    good: 'Καλό',
    imageAutoGenerationTip: 'Η αυτόματη δημιουργία θα ανακτήσει την επιλεγμένη εικόνα Hero.',
    lengthTipDescription:
      'Αυτό πρέπει να είναι μεταξύ {{minLength}} και {{maxLength}} χαρακτήρων. Για βοήθεια στη σύνταξη ποιοτικών μετα-περιγραφών, δείτε ',
    lengthTipTitle:
      'Αυτό πρέπει να είναι μεταξύ {{minLength}} και {{maxLength}} χαρακτήρων. Για βοήθεια στη σύνταξη ποιοτικών μετα-τίτλων, δείτε ',
    missing: 'Λείπει',
    noImage: 'Χωρίς εικόνα',
    preview: 'Προεπισκόπηση',
    previewDescription:
      'Οι ακριβείς καταχωρίσεις αποτελεσμάτων ενδέχεται να διαφέρουν ανάλογα με το περιεχόμενο και τη συνάφεια αναζήτησης.',
    tooLong: 'Πολύ μεγάλο',
    tooShort: 'Πολύ σύντομο',
  },
}
