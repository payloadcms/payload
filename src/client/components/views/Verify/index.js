import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import { useConfig } from '../../providers/Config';
import { useAuthentication } from '../../providers/Authentication';
import Login from '../Login';
import './index.scss';

const baseClass = 'verify';

const Verify = () => {
  const { user } = useAuthentication();
  const { token } = useParams();
  const { pathname } = useLocation();
  const { serverURL, routes: { admin: adminRoute }, admin: { user: adminUser } } = useConfig();

  const collectionToVerify = pathname.split('/')?.[2];
  const isAdminUser = collectionToVerify === adminUser;
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    async function verifyToken() {
      const result = await fetch(`${serverURL}/api/${collectionToVerify}/verify/${token}`, { method: 'POST' });
      setVerifyResult(result);
    }
    verifyToken();
  }, [setVerifyResult, collectionToVerify, pathname, serverURL, token]);

  if (user) {
    return <Login />;
  }

  const getText = () => {
    if (verifyResult?.status === 200) return 'Verified Successfully';
    if (verifyResult?.status === 202) return 'Already Activated';
    return 'Unable To Verify';
  };

  return (
    <MinimalTemplate className={baseClass}>
      <Meta
        title="Verify"
        description="Verify user"
        keywords="Verify, Payload, CMS"
      />
      <div className={`${baseClass}__brand`}>
        <Logo />
      </div>
      <h2>
        {getText()}
      </h2>
      {isAdminUser && verifyResult?.status === 200 && (
        <Button
          el="link"
          buttonStyle="secondary"
          to={`${adminRoute}/login`}
        >
          Login
        </Button>
      )}
    </MinimalTemplate>
  );
};
export default Verify;
