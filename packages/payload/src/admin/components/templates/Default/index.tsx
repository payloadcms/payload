import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types';

import DefaultNav from '../../elements/Nav';
import { useConfig } from '../../utilities/Config';
import Meta from '../../utilities/Meta';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import './index.scss';

const baseClass = 'template-default';

const Default: React.FC<Props> = ({ children, className }) => {
  const {
    admin: {
      components: {
        Nav: CustomNav,
      } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig();
  const { t } = useTranslation('general');

  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Meta
        description={`${t('dashboard')} Payload`}
        keywords={`${t('dashboard')}, Payload`}
        title={t('dashboard')}
      />
      <RenderCustomComponent
        CustomComponent={CustomNav}
        DefaultComponent={DefaultNav}
      />
      <div className={`${baseClass}__wrap`}>
        {children}
      </div>
    </div>
  );
};

export default Default;
