import type { CLICommand } from '../../../config/types.js'
import type { PopulateType, SelectType } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  depthOption,
  fallbackLocaleOption,
  falseByDefaultDraftOption,
  idOption,
  localeOption,
  optionalDataOption,
  populateOption,
  selectedLocalesOption,
  selectOption,
  showHiddenFieldsOption,
} from '../data/options.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createDuplicateDocumentCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'duplicateDocument',
      description: 'Duplicate a document in a local collection.',
      async handler({ options, payload }) {
        const collection = options.slug
        const result = await payload.duplicate({
          id: options.id,
          collection,
          data: options.data
            ? prepareCollectionData({ collection, data: options.data, payload })
            : undefined,
          depth: options.depth,
          draft: options.draft,
          fallbackLocale: options.fallbackLocale,
          locale: options.locale,
          overrideAccess: true,
          populate: options.populate as PopulateType | undefined,
          select: options.select as SelectType | undefined,
          selectedLocales: options.selectedLocales,
          showHiddenFields: options.showHiddenFields,
        })

        printJSON(result)
        return {}
      },
      options: {
        id: idOption,
        slug: collectionSlugOption,
        data: optionalDataOption,
        depth: depthOption,
        draft: falseByDefaultDraftOption,
        fallbackLocale: fallbackLocaleOption,
        locale: localeOption,
        populate: populateOption,
        select: selectOption,
        selectedLocales: selectedLocalesOption,
        showHiddenFields: showHiddenFieldsOption,
      },
      summary: 'Duplicate a collection document',
    },
  })
