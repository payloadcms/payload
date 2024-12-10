'use client'
import { getTranslation } from '@payloadcms/translations'

import type { Action, Option } from './types.js'

const reduceToIDs = (options) =>
  options.reduce((ids, option) => {
    if (option.options) {
      return [...ids, ...reduceToIDs(option.options)]
    }

    return [...ids, option.id]
  }, [])

const optionsReducer = (state: Option[], action: Action): Option[] => {
  switch (action.type) {
    case 'ADD': {
      const { collection, data, hasMultipleRelations, i18n, relation } = action

      const labelKey = collection.admin.useAsTitle || 'id'

      const loadedIDs = reduceToIDs(state)

      if (!hasMultipleRelations) {
        return [
          ...state,
          ...data.docs.reduce((docs, doc) => {
            if (loadedIDs.indexOf(doc.id) === -1) {
              loadedIDs.push(doc.id)
              return [
                ...docs,
                {
                  label: doc[labelKey],
                  value: doc.id,
                },
              ]
            }
            return docs
          }, []),
        ]
      }

      const newOptions = [...state]
      const optionsToAddTo = newOptions.find(
        (optionGroup) => optionGroup.label === getTranslation(collection.labels.plural, i18n),
      )

      const newSubOptions = data.docs.reduce((docs, doc) => {
        if (loadedIDs.indexOf(doc.id) === -1) {
          loadedIDs.push(doc.id)

          return [
            ...docs,
            {
              label: doc[labelKey],
              relationTo: relation,
              value: doc.id,
            },
          ]
        }

        return docs
      }, [])

      if (optionsToAddTo) {
        optionsToAddTo.options = [...optionsToAddTo.options, ...newSubOptions]
      } else {
        newOptions.push({
          label: getTranslation(collection.labels.plural, i18n),
          options: newSubOptions,
          value: undefined,
        })
      }

      return newOptions
    }

    case 'CLEAR': {
      return action.required ? [] : [{ label: action.i18n.t('general:none'), value: 'null' }]
    }

    default: {
      return state
    }
  }
}

export default optionsReducer
