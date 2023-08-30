import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config/index.js';
import Eyebrow from '../../elements/Eyebrow/index.js';
import { useStepNav } from '../../elements/StepNav/index.js';
import Button from '../../elements/Button/index.js';
import Meta from '../../utilities/Meta/index.js';
import { Gutter } from '../../elements/Gutter/index.js';

const baseClass = 'not-found';

const NotFound: React.FC = () => {
  const { setStepNav } = useStepNav();
  const { routes: { admin } } = useConfig();
  const { t } = useTranslation('general');

  useEffect(() => {
    setStepNav([{
      label: t('notFound'),
    }]);
  }, [setStepNav, t]);

  return (
    <div className={baseClass}>
      <Meta
        title={t('notFound')}
        description={t('pageNotFound')}
        keywords={`404 ${t('notFound')}`}
      />
      <Eyebrow />
      <Gutter className={`${baseClass}__wrap`}>
        <h1>{t('nothingFound')}</h1>
        <p>{t('sorryNotFound')}</p>
        <Button
          el="link"
          to={`${admin}`}
        >
          {t('backToDashboard')}
        </Button>
      </Gutter>
    </div>
  );
};

export default NotFound;
