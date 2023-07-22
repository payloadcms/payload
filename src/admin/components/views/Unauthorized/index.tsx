import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import MinimalTemplate from '../../templates/Minimal';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation('general');
  const config = useConfig();
  const {
    routes: { admin },
    admin: {
      logoutRoute,
    },
  } = config;
  return (
    <MinimalTemplate className="unauthorized">
      <Meta
        title={t('error:unauthorized')}
        description={t('error:unauthorized')}
        keywords={t('error:unauthorized')}
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
