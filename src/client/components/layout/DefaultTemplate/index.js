import React from 'react';
import PropTypes from 'prop-types';
import Sidebar from '../Sidebar';
import StepNav, { StepNavProvider } from '../../modules/StepNav';
import Localizer from '../../modules/Localizer';

import './index.scss';

const DefaultTemplate = ({ children }) => {
  return (
    <div className="default-template">
      <div className="wrap">
        <StepNavProvider>
          <Sidebar />
          <div className="eyebrow">
            <StepNav />
            <Localizer />
          </div>
          {children}
        </StepNavProvider>
      </div>
    </div>
  );
};

DefaultTemplate.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default DefaultTemplate;
