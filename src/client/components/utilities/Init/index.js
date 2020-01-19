import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Init = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  if (initialized) {
    return (
      { children }
    );
  }

  return (
    <h1>Not initialized</h1>
  );
};

Init.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};


export default Init;
