import React, { useEffect, useState } from 'react';
import { Props } from './types';
import Search from '../../icons/Search';
import useDebounce from '../../../hooks/useDebounce';

import './index.scss';

const baseClass = 'search-filter';

const SearchFilter: React.FC<Props> = (props) => {
  const {
    fieldName,
    fieldLabel,
    handleChange,
  } = props;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (typeof handleChange === 'function') {
      handleChange(debouncedSearch ? {
        [fieldName]: {
          like: debouncedSearch,
        },
      } : null);
    }
  }, [debouncedSearch, handleChange, fieldName]);

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder={`Search by ${fieldLabel}`}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Search />
    </div>
  );
};

export default SearchFilter;
