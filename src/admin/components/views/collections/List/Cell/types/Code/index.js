import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const CodeCell = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substr(0, 100)}\u2026` : data;
  return (
    <code className="code-cell">
      <span>{textToShow}</span>
    </code>
  );
};

CodeCell.defaultProps = {
  data: '',
};

CodeCell.propTypes = {
  data: PropTypes.string,
};

export default CodeCell;
