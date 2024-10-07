import type { GenericTranslationsObject } from '@payloadcms/translations'

export const fr: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'On y est presque',
    autoGenerate: 'Auto-générer',
    bestPractices: 'bonnes pratiques',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caractères, ',
    charactersLeftOver: '{{characters}} restants',
    charactersToGo: '{{characters}} à ajouter',
    charactersTooMany: '{{characters}} en trop',
    checksPassing: '{{current}}/{{max}} vérifications réussies',
    good: 'Bien',
    imageAutoGenerationTip: "L'auto-génération récupérera l'image principale sélectionnée.",
    lengthTipDescription:
      "Ceci devrait contenir entre {{minLength}} et {{maxLength}} caractères. Pour obtenir de l'aide pour rédiger des descriptions meta de qualité, consultez les ",
    lengthTipTitle:
      "Ceci devrait contenir entre {{minLength}} et {{maxLength}} caractères. Pour obtenir de l'aide pour rédiger des titres meta de qualité, consultez les ",
    missing: 'Manquant',
    noImage: "Pas d'image",
    preview: 'Aperçu',
    previewDescription:
      'Les résultats exacts peuvent varier en fonction du contenu et de la pertinence de la recherche.',
    tooLong: 'Trop long',
    tooShort: 'Trop court',
  },
}
