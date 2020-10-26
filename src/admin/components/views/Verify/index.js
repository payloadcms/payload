import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import { useConfig } from '../../providers/Config';
import { useAuth } from '../../providers/Authentication';
import Login from '../Login';
import './index.scss';

const baseClass = 'verify';

const Verify = ({ collection }) => {
  const { slug: collectionSlug } = collection;

  const { user } = useAuth();
  const { token } = useParams();
  const { serverURL, routes: { admin: adminRoute }, admin: { user: adminUser } } = useConfig();

  const isAdminUser = collectionSlug === adminUser;
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    async function verifyToken() {
      const result = await fetch(`${serverURL}/api/${collectionSlug}/verify/${token}`, { method: 'POST' });
      setVerifyResult(result);
    }
    verifyToken();
  }, [setVerifyResult, collectionSlug, serverURL, token]);

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

Verify.propTypes = {
  collection: PropTypes.shape({
    slug: PropTypes.string,
  }).isRequired,
};
export default Verify;
