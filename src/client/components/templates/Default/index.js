import React from 'react';
import PropTypes from 'prop-types';
import DefaultNav from '../../elements/Nav';
import { useConfig } from '../../providers/Config';
import { StepNavProvider } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import Meta from '../../utilities/Meta';

import './index.scss';

const baseClass = 'template-default';

const Default = ({ children, className }) => {
  const {
    admin: {
      components: {
        Nav: CustomNav,
      } = {},
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

Default.defaultProps = {
  className: '',
};

Default.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default Default;
