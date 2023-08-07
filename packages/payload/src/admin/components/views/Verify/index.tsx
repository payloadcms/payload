import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import Login from '../Login';

import './index.scss';

const baseClass = 'verify';

const Verify: React.FC<{ collection: SanitizedCollectionConfig }> = ({ collection }) => {
  const { slug: collectionSlug } = collection;

  const { user } = useAuth();
  const { token } = useParams<{token?: string}>();
  const { serverURL, routes: { admin: adminRoute }, admin: { user: adminUser } } = useConfig();
  const { t, i18n } = useTranslation('authentication');

  const isAdminUser = collectionSlug === adminUser;
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    async function verifyToken() {
      const result = await fetch(`${serverURL}/api/${collectionSlug}/verify/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      });
      setVerifyResult(result);
    }
    verifyToken();
  }, [setVerifyResult, collectionSlug, serverURL, token, i18n]);

  if (user) {
    return <Login />;
  }

  const getText = () => {
    if (verifyResult?.status === 200) return t('verifiedSuccessfully');
    if (verifyResult?.status === 202) return t('alreadyActivated');
    return t('unableToVerify');
  };

  return (
    <MinimalTemplate className={baseClass}>
      <Meta
        title={t('verify')}
        description={t('verifyUser')}
        keywords={t('verify')}
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
          {t('login')}
        </Button>
      )}
    </MinimalTemplate>
  );
};
export default Verify;
