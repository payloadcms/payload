import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import config from 'payload/config';
import { useUser } from '../../data/User';
import Minimal from '../../templates/Minimal';
import Button from '../../elements/Button';

import './index.scss';

const { routes: { admin } } = config;

const baseClass = 'logout';

const Logout = (props) => {
  const { inactivity } = props;

  const { logOut } = useUser();

  useEffect(() => {
    logOut();
  }, [logOut]);

  return (
    <Minimal className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {inactivity && (
          <h2>You have been logged out due to inactivity.</h2>
        )}
        {!inactivity && (
          <h2>You have been logged out successfully.</h2>
        )}
        <br />
        <Button
          el="anchor"
          buttonStyle="secondary"
          url={`${admin}/login`}
        >
          Log back in
        </Button>
      </div>
    </Minimal>
  );
};

Logout.defaultProps = {
  inactivity: false,
};

Logout.propTypes = {
  inactivity: PropTypes.bool,
};

export default Logout;
