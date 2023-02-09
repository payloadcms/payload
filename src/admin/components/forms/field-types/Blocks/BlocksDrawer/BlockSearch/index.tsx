import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchIcon from '../../../../../graphics/Search';

import './index.scss';

const baseClass = 'block-search';

const BlockSearch: React.FC<{ setSearchTerm: (term: string) => void }> = (props) => {
  const { setSearchTerm } = props;
  const { t } = useTranslation('fields');

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        placeholder={t('searchForBlock')}
        onChange={handleChange}
      />
      <SearchIcon />
    </div>
  );
};

export default BlockSearch;
