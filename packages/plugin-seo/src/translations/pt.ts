import type { GenericTranslationsObject } from '@payloadcms/translations'

export const pt: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Quase lá',
    autoGenerate: 'Gerar automaticamente',
    bestPractices: 'melhores práticas',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caracteres, ',
    charactersLeftOver: '{{characters}} caracteres a mais',
    charactersToGo: '{{characters}} caracteres restantes',
    charactersTooMany: '{{characters}} caracteres em excesso',
    checksPassing: '{{current}}/{{max}} verificações aprovadas',
    good: 'Bom',
    imageAutoGenerationTip: 'A geração automática buscará a imagem destacada selecionada.',
    lengthTipDescription:
      'Isso deve ter entre {{minLength}} e {{maxLength}} caracteres. Para obter ajuda na escrita de descrições meta de qualidade, veja ',
    lengthTipTitle:
      'Isso deve ter entre {{minLength}} e {{maxLength}} caracteres. Para obter ajuda na escrita de títulos meta de qualidade, veja ',
    missing: 'Ausente',
    noImage: 'Nenhuma imagem',
    preview: 'Pré-visualização',
    previewDescription:
      'Os resultados exatos podem variar com base no conteúdo e na relevância da pesquisa.',
    tooLong: 'Muito longo',
    tooShort: 'Muito curto',
  },
}
