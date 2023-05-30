import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import Search from '../../icons/Search';
import useDebounce from '../../../hooks/useDebounce';
import { useSearchParams } from '../../utilities/SearchParams';
import { Where, WhereField } from '../../../../types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'search-filter';

const SearchFilter: React.FC<Props> = (props) => {
  const {
    fieldName = 'id',
    fieldLabel = 'ID',
    modifySearchQuery = true,
    listSearchableFields,
    handleChange,
  } = props;

  const params = useSearchParams();
  const history = useHistory();
  const { t, i18n } = useTranslation('general');

  const [search, setSearch] = useState('');
  const [previousSearch, setPreviousSearch] = useState('');

  const placeholder = useRef(t('searchBy', { label: getTranslation(fieldLabel, i18n) }));

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const newWhere: Where = { ...typeof params?.where === 'object' ? params.where as Where : {} };
    const fieldNamesToSearch = [fieldName, ...(listSearchableFields || []).map(({ name }) => name)];

    fieldNamesToSearch.forEach((fieldNameToSearch) => {
      const hasOrQuery = Array.isArray(newWhere.or);
      const existingFieldSearchIndex = hasOrQuery ? newWhere.or.findIndex((condition) => {
        return (condition?.[fieldNameToSearch] as WhereField)?.like;
      }) : -1;

      if (debouncedSearch) {
        if (!hasOrQuery) newWhere.or = [];

        if (existingFieldSearchIndex > -1) {
          (newWhere.or[existingFieldSearchIndex][fieldNameToSearch] as WhereField).like = debouncedSearch;
        } else {
          newWhere.or.push({
            [fieldNameToSearch]: {
              like: debouncedSearch,
            },
          });
        }
      } else if (existingFieldSearchIndex > -1) {
        newWhere.or.splice(existingFieldSearchIndex, 1);
      }
    });

    if (debouncedSearch !== previousSearch) {
      if (handleChange) handleChange(newWhere as Where);

      if (modifySearchQuery) {
        history.replace({
          search: queryString.stringify({
            ...params,
            page: 1,
            where: newWhere,
          }),
        });
      }

      setPreviousSearch(debouncedSearch);
    }
  }, [debouncedSearch, previousSearch, history, fieldName, params, handleChange, modifySearchQuery, listSearchableFields]);

  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      placeholder.current = listSearchableFields.reduce<string>((prev, curr, i) => {
        if (i === listSearchableFields.length - 1) {
          return `${prev} ${t('or')} ${getTranslation(curr.label || curr.name, i18n)}`;
        }
        return `${prev}, ${getTranslation(curr.label || curr.name, i18n)}`;
      }, placeholder.current);
    } else {
      placeholder.current = t('searchBy', { label: getTranslation(fieldLabel, i18n) });
    }
  }, [t, listSearchableFields, i18n, fieldLabel]);

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
