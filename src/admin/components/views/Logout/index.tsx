import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import Minimal from '../../templates/Minimal';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import './index.scss';

const baseClass = 'logout';

const Logout: React.FC<{inactivity?: boolean}> = (props) => {
  const { inactivity } = props;

  const { logOut } = useAuth();
  const { routes: { admin } } = useConfig();
  const { t } = useTranslation('authentication');

  // Fetch 'originalUrl' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const query = new URLSearchParams(useLocation().search);
  const originalUrl = query.get('originalUrl');

  useEffect(() => {
    logOut();
  }, [logOut]);

  return (
    <Minimal className={baseClass}>
      <Meta
        title={t('logout')}
        description={t('logoutUser')}
        keywords={t('logout')}
      />
      <div className={`${baseClass}__wrap`}>
        {inactivity && (
          <h2>{t('loggedOutInactivity')}</h2>
        )}
        {!inactivity && (
          <h2>{t('loggedOutSuccessfully')}</h2>
        )}
        <br />
        <Button
          el="anchor"
          buttonStyle="secondary"
          url={`${admin}/login${originalUrl && originalUrl.length > 0 ? `?originalUrl=${encodeURIComponent(originalUrl)}` : ''}`}
        >
          {t('logBackIn')}
        </Button>
      </div>
    </Minimal>
  );
};

export default Logout;
