import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import DefaultSidebar from '../Sidebar';
import StepNav, { useStepNav, StepNavProvider } from '../../modules/StepNav';
import { StatusListProvider } from '../../modules/Status';
import Localizer from '../../modules/Localizer';
import customComponents from '../../custom-components';

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

const baseClass = 'default-template';

const DefaultTemplate = ({ children, className, stepNav }) => {
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
            <Localizer />
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

DefaultTemplate.defaultProps = {
  className: '',
  stepNav: [],
};

DefaultTemplate.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  stepNav: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
};

export default DefaultTemplate;
