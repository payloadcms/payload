import React from 'react';
import PropTypes from 'prop-types';
import DefaultNav from '../../elements/Nav';
import { StepNavProvider } from '../../elements/StepNav';
import customComponents from '../../customComponents';

import './index.scss';

const Nav = customComponents?.layout?.Nav || DefaultNav;

const baseClass = 'template-default';

const Default = ({ children, className }) => {
  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <StepNavProvider>
        <Nav />
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
