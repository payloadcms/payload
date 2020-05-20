import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Search from '../../icons/Search';

import './index.scss';

const baseClass = 'search-filter';

const SearchFilter = (props) => {
  const {
    fieldName,
    fieldLabel,
    handleChange,
  } = props;

  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch(search);

    handleChange(search ? {
      [fieldName]: {
        like: search,
      },
    } : {});
  }, [search, handleChange, fieldName]);

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder={`Search by ${fieldLabel}`}
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <Search />
    </div>
  );
};

SearchFilter.defaultProps = {
  fieldName: 'id',
  fieldLabel: 'ID',
};

SearchFilter.propTypes = {
  fieldName: PropTypes.string,
  fieldLabel: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
};

export default SearchFilter;
