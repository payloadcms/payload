import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '@payloadcms/config-provider';
import { useAuth } from '@payloadcms/config-provider';
import Minimal from '../../templates/Minimal';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import './index.scss';

const baseClass = 'logout';

const Logout = (props) => {
  const { inactivity } = props;

  const { logOut } = useAuth();
  const { routes: { admin } } = useConfig();

  useEffect(() => {
    logOut();
  }, [logOut]);

  return (
    <Minimal className={baseClass}>
      <Meta
        title="Logout"
        description="Logout user"
        keywords="Logout, Payload, CMS"
      />
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
