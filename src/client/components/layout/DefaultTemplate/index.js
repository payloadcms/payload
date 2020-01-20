import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Sidebar from '../Sidebar';
import StepNav, { useStepNav, StepNavProvider } from '../../modules/StepNav';
import StatusList, { StatusListProvider } from '../../modules/Status';
import Localizer from '../../modules/Localizer';

import './index.scss';

const SetStepNav = ({ stepNav }) => {
  const { setStepNav } = useStepNav();
  useEffect(() => setStepNav(stepNav), []);

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
      <div className="wrap">
        <StatusListProvider>
          <StepNavProvider>
            <Sidebar />
            <div className="eyebrow">
              <StepNav />
              <Localizer />
            </div>
            <StatusList />
            {children}
            <SetStepNav stepNav={stepNav} />
          </StepNavProvider>
        </StatusListProvider>
      </div>
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
