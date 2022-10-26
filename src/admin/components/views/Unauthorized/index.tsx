import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import MinimalTemplate from '../../templates/Minimal';

const Unauthorized: React.FC = () => {
  const { routes: { admin } } = useConfig();
  const { t } = useTranslation('general');

  return (
    <MinimalTemplate className="unauthorized">
      <Meta
        title={t('unauthorized')}
        description={t('unauthorized')}
        keywords={t('unauthorized')}
      />
      <h2>{t('unauthorized')}</h2>
      <p>{t('youAreNotAllowed')}</p>
      <br />
      <Button
        el="link"
        to={`${admin}/logout`}
      >
        {t('authentication:logOut')}
      </Button>
    </MinimalTemplate>
  );
};

export default Unauthorized;
