import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../elements/Button';
import MinimalTemplate from '../../templates/Minimal';
import { useConfig } from '../../utilities/Config';
import Meta from '../../utilities/Meta';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation('general');
  const config = useConfig();
  const {
    admin: {
      logoutRoute,
    },
    routes: { admin },
  } = config;
  return (
    <MinimalTemplate className="unauthorized">
      <Meta
        description={t('error:unauthorized')}
        keywords={t('error:unauthorized')}
        title={t('error:unauthorized')}
      />
      <h2>{t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button
        el="link"
        to={`${admin}${logoutRoute}`}
      >
        {t('authentication:logOut')}
      </Button>
    </MinimalTemplate>
  );
};

export default Unauthorized;
