import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'block-search';

const BlockSearch = (props) => {
  const {} = props;

  return (
    <div className={baseClass}>
      Search...
    </div>
  );
};

BlockSearch.defaultProps = {};

BlockSearch.propTypes = {};

export default BlockSearch;
