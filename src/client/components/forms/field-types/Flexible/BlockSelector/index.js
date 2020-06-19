import React from 'react';
import PropTypes from 'prop-types';

import BlockSearch from './BlockSearch';
import BlocksContainer from './BlocksContainer';

const baseClass = 'block-selector';

const BlockSelector = (props) => {
  return (
    <div className={baseClass}>
      <BlockSearch />
      <BlocksContainer {...props} />
    </div>
  );
};

BlockSelector.defaultProps = {};

BlockSelector.propTypes = {};

export default BlockSelector;
