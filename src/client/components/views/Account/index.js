import React from 'react';
import Minimal from '../../templates/Minimal';

import './index.scss';

const baseClass = 'account';

const Account = () => {
  return (
    <Minimal className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>Account</h1>
      </div>
    </Minimal>
  );
};

export default Account;
