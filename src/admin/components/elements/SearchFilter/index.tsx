import React, { useEffect, useRef, useState } from 'react';
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
    searchableTextFields,
    handleChange,
  } = props;

  const params = useSearchParams();
  const history = useHistory();

  const [search, setSearch] = useState(() => params?.where?.[fieldName]?.like || '');

  const placeholder = useRef(`Search by ${fieldLabel}`);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch || params?.where) {
      let newWhere = searchableTextFields?.length > 0 ? {
        ...(typeof params?.where === 'object' ? params.where : {}),
        or: [
          {
            [fieldName]: {
              like: debouncedSearch,
            },
          },
          ...searchableTextFields.reduce<Array<{
          [key: string]: {
            like: string,
          }
        }>>((prev, curr) => {
          return [
            ...prev,
            {
              [curr.name]: {
                like: debouncedSearch,
              },
            },
          ];
        }, []),
        ],
      } : {
        ...(typeof params?.where === 'object' ? params.where : {}),
        [fieldName]: {
          like: debouncedSearch,
        },
      };

      if (!debouncedSearch) {
        newWhere = undefined;
      }

      if (handleChange) handleChange(newWhere as Where);

      if (modifySearchQuery && queryString.stringify(params?.where) !== queryString.stringify(newWhere)) {
        history.replace({
          search: queryString.stringify({
            ...params,
            page: 1,
            where: newWhere,
          }),
        });
      }
    }
  }, [debouncedSearch, history, fieldName, params, handleChange, modifySearchQuery, searchableTextFields]);

  useEffect(() => {
    if (searchableTextFields?.length > 0) {
      placeholder.current = searchableTextFields.reduce<string>((previousValue, currentValue, currentIndex) => {
        if (currentIndex === searchableTextFields.length - 1) {
          return `${previousValue} or ${currentValue.label || currentValue.name}`;
        }
        return `${previousValue}, ${currentValue.label || currentValue.name}`;
      }, placeholder.current);
    }
  }, [searchableTextFields]);

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder={placeholder.current}
        type="text"
        value={search || ''}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Search />
    </div>
  );
};

export default SearchFilter;
