import React from 'react';

import SearchIcon from '../../../../../graphics/Search';

import './index.scss';

const baseClass = 'block-search';

const BlockSearch = () => {
  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder="Search for a block"
      />
      <SearchIcon />
    </div>
  );
};

export default BlockSearch;
