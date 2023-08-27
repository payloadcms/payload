import { useEffect } from 'react';
import equal from 'deep-equal';
import { FilterOptions } from '../../../../fields/config/types.js';
import { useAuth } from '../Auth.js';
import { useDocumentInfo } from '../DocumentInfo.js';
import { useAllFormFields } from '../../forms/Form/context.js';
import { getFilterOptionsQuery } from '../../forms/field-types/getFilterOptionsQuery.js';
import { FilterOptionsResult } from '../../forms/field-types/Relationship/types.js';
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues.js';
import getSiblingData from '../../forms/Form/getSiblingData.js';

type Args = {
  filterOptions: FilterOptions
  filterOptionsResult: FilterOptionsResult
  setFilterOptionsResult: (optionFilters: FilterOptionsResult) => void
  relationTo: string | string[]
  path: string
}

export const GetFilterOptions = ({
  filterOptions,
  filterOptionsResult,
  setFilterOptionsResult,
  relationTo,
  path,
}: Args): null => {
  const [fields] = useAllFormFields();
  const { id } = useDocumentInfo();
  const { user } = useAuth();

  useEffect(() => {
    const data = reduceFieldsToValues(fields, true);
    const siblingData = getSiblingData(fields, path);

    const getFilterOptions = async () => {
      const newFilterOptionsResult = await getFilterOptionsQuery(filterOptions, {
        id,
        data,
        relationTo,
        siblingData,
        user,
      });

      if (!equal(newFilterOptionsResult, filterOptionsResult)) {
        setFilterOptionsResult(newFilterOptionsResult);
      }
    };
    getFilterOptions();
  }, [
    fields,
    filterOptions,
    id,
    relationTo,
    user,
    path,
    filterOptionsResult,
    setFilterOptionsResult,
  ]);

  return null;
};
