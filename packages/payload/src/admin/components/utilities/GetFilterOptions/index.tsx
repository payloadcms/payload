import equal from 'deep-equal'
import { useEffect } from 'react'

import type { FilterOptions } from '../../../../fields/config/types.js'
import type { FilterOptionsResult } from '../../forms/field-types/Relationship/types.js'

import { useAllFormFields } from '../../forms/Form/context.js'
import getSiblingData from '../../forms/Form/getSiblingData.js'
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues.js'
import { getFilterOptionsQuery } from '../../forms/field-types/getFilterOptionsQuery.js'
import { useAuth } from '../Auth/index.js'
import { useDocumentInfo } from '../DocumentInfo/index.js'

type Args = {
  filterOptions: FilterOptions
  filterOptionsResult: FilterOptionsResult
  path: string
  relationTo: string | string[]
  setFilterOptionsResult: (optionFilters: FilterOptionsResult) => void
}

export const GetFilterOptions = ({
  filterOptions,
  filterOptionsResult,
  path,
  relationTo,
  setFilterOptionsResult,
}: Args): null => {
  const [fields] = useAllFormFields()
  const { id } = useDocumentInfo()
  const { user } = useAuth()

  useEffect(() => {
    const data = reduceFieldsToValues(fields, true)
    const siblingData = getSiblingData(fields, path)

    const getFilterOptions = async () => {
      const newFilterOptionsResult = await getFilterOptionsQuery(filterOptions, {
        data,
        id,
        relationTo,
        siblingData,
        user,
      })

      if (!equal(newFilterOptionsResult, filterOptionsResult)) {
        setFilterOptionsResult(newFilterOptionsResult)
      }
    }
    getFilterOptions()
  }, [
    fields,
    filterOptions,
    id,
    relationTo,
    user,
    path,
    filterOptionsResult,
    setFilterOptionsResult,
  ])

  return null
}
