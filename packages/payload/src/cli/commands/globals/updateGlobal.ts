import type { CLICommand } from '../../../config/types.js'
import type { PopulateType, SelectType } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  depthOption,
  fallbackLocaleOption,
  falseByDefaultDraftOption,
  globalSlugOption,
  localeOption,
  overrideLockOption,
  populateOption,
  publishAllLocalesOption,
  requiredDataOption,
  selectOption,
  showHiddenFieldsOption,
  unpublishAllLocalesOption,
} from '../data/options.js'
import { prepareGlobalData, printJSON } from '../data/utilities.js'

export const createUpdateGlobalCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'updateGlobal',
      description: 'Update a local global.',
      async handler({ options, payload }) {
        const slug = options.slug
        const result = await payload.updateGlobal({
          slug,
          data: prepareGlobalData({ slug, data: options.data, payload }),
          depth: options.depth,
          draft: options.draft,
          fallbackLocale: options.fallbackLocale,
          locale: options.locale,
          overrideAccess: true,
          overrideLock: options.overrideLock,
          populate: options.populate as PopulateType | undefined,
          publishAllLocales: options.publishAllLocales,
          select: options.select as SelectType | undefined,
          showHiddenFields: options.showHiddenFields,
          unpublishAllLocales: options.unpublishAllLocales,
        })

        printJSON(result)
        return {}
      },
      options: {
        slug: globalSlugOption,
        data: requiredDataOption,
        depth: depthOption,
        draft: falseByDefaultDraftOption,
        fallbackLocale: fallbackLocaleOption,
        locale: localeOption,
        overrideLock: overrideLockOption,
        populate: populateOption,
        publishAllLocales: publishAllLocalesOption,
        select: selectOption,
        showHiddenFields: showHiddenFieldsOption,
        unpublishAllLocales: unpublishAllLocalesOption,
      },
      summary: 'Update a global',
    },
  })
