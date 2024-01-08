import type { Action, Option, OptionGroup } from './types'

import { getTranslation } from '@payloadcms/translations'
import { formatDocTitle } from '../../../utilities/formatDocTitle'

const reduceToIDs = (options) =>
  options.reduce((ids, option) => {
    if (option.options) {
      return [...ids, ...reduceToIDs(option.options)]
    }

    return [...ids, option.value]
  }, [])

const sortOptions = (options: Option[]): Option[] =>
  options.sort((a: Option, b: Option) => {
    if (
      typeof a?.label?.localeCompare === 'function' &&
      typeof b?.label?.localeCompare === 'function'
    ) {
      return a.label.localeCompare(b.label)
    }

    return 0
  })

const optionsReducer = (state: OptionGroup[], action: Action): OptionGroup[] => {
  switch (action.type) {
    case 'CLEAR': {
      return []
    }

    case 'UPDATE': {
      const { collection, config, doc, i18n } = action
      const relation = collection.slug
      const newOptions = [...state]

      const docTitle = formatDocTitle({
        useAsTitle: collection.admin.useAsTitle,
        doc,
        // i18n,
      })

      const foundOptionGroup = newOptions.find(
        (optionGroup) => optionGroup.label === collection.labels.plural,
      )
      const foundOption = foundOptionGroup?.options?.find((option) => option.value === doc.id)

      if (foundOption) {
        foundOption.label = docTitle || `${i18n.t('general:untitled')} - ID: ${doc.id}`
        foundOption.relationTo = relation
      }

      return newOptions
    }

    case 'ADD': {
      const { collection, config, docs, i18n, ids = [], sort } = action
      const relation = collection.slug
      const loadedIDs = reduceToIDs(state)
      const newOptions = [...state]
      const optionsToAddTo = newOptions.find(
        (optionGroup) => optionGroup.label === collection.labels.plural,
      )

      const newSubOptions = docs.reduce((docSubOptions, doc) => {
        if (loadedIDs.indexOf(doc.id) === -1) {
          loadedIDs.push(doc.id)

          const docTitle = formatDocTitle({
            useAsTitle: collection.admin.useAsTitle,
            doc,
            // i18n,
          })

          return [
            ...docSubOptions,
            {
              label: docTitle || `${i18n.t('general:untitled')} - ID: ${doc.id}`,
              relationTo: relation,
              value: doc.id,
            },
          ]
        }

        return docSubOptions
      }, [])

      ids.forEach((id) => {
        if (!loadedIDs.includes(id)) {
          newSubOptions.push({
            label: `${i18n.t('general:untitled')} - ID: ${id}`,
            relationTo: relation,
            value: id,
          })
        }
      })

      if (optionsToAddTo) {
        const subOptions = [...optionsToAddTo.options, ...newSubOptions]

        optionsToAddTo.options = sort ? sortOptions(subOptions) : subOptions
      } else {
        newOptions.push({
          label: getTranslation(collection.labels.plural, i18n),
          options: sort ? sortOptions(newSubOptions) : newSubOptions,
        })
      }

      return newOptions
    }

    default: {
      return state
    }
  }
}

export default optionsReducer
