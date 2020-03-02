import React, { useEffect } from 'react';
import { useUser } from '../../data/User';
import ContentBlock from '../../layout/ContentBlock';
import config from '../../../config/sanitizedClientConfig';
import Button from '../../controls/Button';

import './index.scss';

const baseClass = 'logout';

const {
  routes: {
    admin,
  },
} = config;

const Logout = () => {
  const { logOut } = useUser();

  useEffect(() => {
    logOut();
  }, [logOut]);

  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <h1>You have been logged out.</h1>
        <br />
        <Button
          el="anchor"
          type="secondary"
          url={`${admin}/login`}
        >
          Log back in
        </Button>
      </div>
    </ContentBlock>
  );
};

export default Logout;
