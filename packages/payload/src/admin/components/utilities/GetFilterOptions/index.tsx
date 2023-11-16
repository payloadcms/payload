import equal from 'deep-equal'
import { useEffect } from 'react'

import type { FilterOptions } from '../../../../fields/config/types'
import type { FilterOptionsResult } from '../../forms/field-types/Relationship/types'

import { useAllFormFields } from '../../forms/Form/context'
import getSiblingData from '../../forms/Form/getSiblingData'
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues'
import { getFilterOptionsQuery } from '../../forms/field-types/getFilterOptionsQuery'
import { useAuth } from '../Auth'
import { useDocumentInfo } from '../DocumentInfo'

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
        id,
        data,
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
