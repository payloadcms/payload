import React from 'react';
import PropTypes from 'prop-types';
import unsanitizedConfig from 'payload/unsanitizedConfig';
import sanitizeConfig from '../../../../utilities/sanitizeConfig';
import Context from './context';

const sanitizedConfig = sanitizeConfig(unsanitizedConfig);

const ConfigProvider = ({ children }) => (
  <Context.Provider value={sanitizedConfig}>
    {children}
  </Context.Provider>
);

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ConfigProvider;
