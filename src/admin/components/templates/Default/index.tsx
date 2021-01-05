import React from 'react';
import { useConfig } from '@payloadcms/config-provider';
import DefaultNav from '../../elements/Nav';
import { StepNavProvider } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import Meta from '../../utilities/Meta';
import { Props } from './types';

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

  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <StepNavProvider>
        <Meta
          title="Dashboard"
          description="Dashboard for Payload CMS"
          keywords="Dashboard, Payload, CMS"
        />
        <RenderCustomComponent
          DefaultComponent={DefaultNav}
          CustomComponent={CustomNav}
        />
        <div className={`${baseClass}__wrap`}>
          {children}
        </div>
      </StepNavProvider>
    </div>
  );
};

export default Default;
