import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import DefaultSidebar from '../../elements/Sidebar';
import StepNav, { useStepNav, StepNavProvider } from '../../elements/StepNav';
import { StatusListProvider } from '../../elements/Status';
import customComponents from '../../customComponents';

import './index.scss';

const Sidebar = customComponents?.layout?.Sidebar || DefaultSidebar;

const SetStepNav = ({ stepNav }) => {
  const { setStepNav } = useStepNav();
  useEffect(() => setStepNav(stepNav), [setStepNav, stepNav]);

  return null;
};

SetStepNav.propTypes = {
  stepNav: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

const baseClass = 'template-default';

const Default = ({ children, className, stepNav }) => {
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
          <SetStepNav stepNav={stepNav} />
        </StepNavProvider>
      </StatusListProvider>
    </div>
  );
};

Default.defaultProps = {
  className: '',
  stepNav: [],
};

Default.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  stepNav: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
};

export default Default;
