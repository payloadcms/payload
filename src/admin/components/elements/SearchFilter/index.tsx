import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { Props } from './types';
import Search from '../../icons/Search';
import useDebounce from '../../../hooks/useDebounce';
import { useSearchParams } from '../../utilities/SearchParams';
import { Where } from '../../../../types';

import './index.scss';

const baseClass = 'search-filter';

const SearchFilter: React.FC<Props> = (props) => {
  const {
    fieldName = 'id',
    fieldLabel = 'ID',
    modifySearchQuery = true,
    handleChange,
  } = props;

  const params = useSearchParams();
  const history = useHistory();

  const [search, setSearch] = useState(() => params?.where?.[fieldName]?.like || '');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch !== params?.where?.[fieldName]?.like) {
      const newWhere = {
        ...(typeof params?.where === 'object' ? params.where : {}),
        [fieldName]: {
          like: debouncedSearch,
        },
      };

      if (!debouncedSearch) {
        delete newWhere[fieldName];
      }

      if (handleChange) handleChange(newWhere as Where);

      if (modifySearchQuery && params?.where?.[fieldName]?.like !== newWhere?.[fieldName]?.like) {
        history.replace({
          search: queryString.stringify({
            ...params,
            page: 1,
            where: newWhere,
          }),
        });
      }
    }
  }, [debouncedSearch, history, fieldName, params, handleChange, modifySearchQuery]);

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder={`Search by ${fieldLabel}`}
        type="text"
        value={search || ''}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Search />
    </div>
  );
};

export default SearchFilter;
