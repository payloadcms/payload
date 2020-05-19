import React, { useEffect } from 'react';
import { useStepNav } from '../../elements/StepNav';

import './index.scss';

const baseClass = 'account';

const Account = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      {
        label: 'Account',
      },
    ]);
  }, [setStepNav]);

  return (
    <div className={baseClass}>
      <h1>Account</h1>
    </div>
  );
};

export default Account;
