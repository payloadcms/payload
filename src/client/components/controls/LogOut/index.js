import React from 'react';
import { useHistory } from 'react-router-dom';
import Cookies from 'universal-cookie';
import PropTypes from 'prop-types';
import getSanitizedConfig from '../../../config/getSanitizedConfig';

import './index.scss';

const {
  routes: {
    admin,
  },
} = getSanitizedConfig();

const baseClass = 'log-out';

const cookies = new Cookies();

const LogOut = ({ children }) => {
  const history = useHistory();

  const logOut = () => {
    cookies.remove('token');
    history.push(`${admin}/login`);
  };

  return (
    <button
      className={baseClass}
      type="button"
      onClick={logOut}
    >
      {children}
    </button>
  );
};

LogOut.defaultProps = {
  children: 'Log Out',
};

LogOut.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export default LogOut;
