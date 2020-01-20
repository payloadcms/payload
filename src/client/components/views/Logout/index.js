import React from 'react';
import Cookies from 'universal-cookie';
import ContentBlock from '../../layout/ContentBlock';
import getSanitizedConfig from '../../../config/getSanitizedConfig';
import Button from '../../controls/Button';

import './index.scss';

const cookies = new Cookies();

const baseClass = 'logout';

const {
  routes: {
    admin,
  },
} = getSanitizedConfig();

const Logout = () => {
  const token = cookies.remove('token');

  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <h1>You have been logged out.</h1>
        <br />
        <Button
          el="link"
          type="secondary"
          to={`${admin}/login`}
        >
          Log back in
        </Button>
      </div>
    </ContentBlock>
  );
};

export default Logout;
