import React from 'react';
import PropTypes from 'prop-types';
import DefaultSidebar from '../../elements/Sidebar';
import StepNav, { StepNavProvider } from '../../elements/StepNav';
import { StatusListProvider } from '../../elements/Status';
import customComponents from '../../customComponents';

import './index.scss';

const Sidebar = customComponents?.layout?.Sidebar || DefaultSidebar;

const baseClass = 'template-default';

const Default = ({ children, className }) => {
  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <StatusListProvider>
        <StepNavProvider>
          <Sidebar />
          <div className={`${baseClass}__eyebrow`}>
            <StepNav />
          </div>
          <div className={`${baseClass}__wrap`}>
            {children}
          </div>
        </StepNavProvider>
      </StatusListProvider>
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
