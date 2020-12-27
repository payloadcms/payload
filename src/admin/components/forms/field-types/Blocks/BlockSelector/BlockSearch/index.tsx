import React from 'react';
import SearchIcon from '../../../../../graphics/Search';

import './index.scss';

const baseClass = 'block-search';

const BlockSearch: React.FC<{ setSearchTerm: (term: string) => void }> = (props) => {
  const { setSearchTerm } = props;

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder="Search for a block"
        onChange={handleChange}
      />
      <SearchIcon />
    </div>
  );
};

export default BlockSearch;
