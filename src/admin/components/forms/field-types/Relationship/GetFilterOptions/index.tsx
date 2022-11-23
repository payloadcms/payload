import { useEffect } from 'react';
import equal from 'deep-equal';
import { FilterOptions } from '../../../../../../fields/config/types';
import { useAuth } from '../../../../utilities/Auth';
import { useDocumentInfo } from '../../../../utilities/DocumentInfo';
import { useWatchForm } from '../../../Form/context';
import { getFilterOptionsQuery } from '../../getFilterOptionsQuery';
import { FilterOptionsResult } from '../types';

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
  const { getSiblingData, getData } = useWatchForm();
  const { id } = useDocumentInfo();
  const { user } = useAuth();

  useEffect(() => {
    const data = getData();
    const siblingData = getSiblingData(path);

    const newFilterOptionsResult = getFilterOptionsQuery(filterOptions, {
      id,
      data,
      relationTo,
      siblingData,
      user,
    });

    if (!equal(newFilterOptionsResult, filterOptionsResult)) {
      setFilterOptionsResult(newFilterOptionsResult);
    }
  }, [
    getData,
    getSiblingData,
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
