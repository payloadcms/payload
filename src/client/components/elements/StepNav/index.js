import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Chevron from '../../icons/Chevron';

import './index.scss';

const Context = createContext({});

const StepNavProvider = ({ children }) => {
  const [stepNav, setStepNav] = useState([]);

  return (
    <Context.Provider value={{
      stepNav,
      setStepNav,
    }}
    >
      {children}
    </Context.Provider>
  );
};

StepNavProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

const useStepNav = () => useContext(Context);

const StepNav = () => {
  const dashboardLabel = <span>Dashboard</span>;
  const { stepNav } = useStepNav();

  return (
    <nav className="step-nav">
      {stepNav.length > 0
        ? (
          <Link to="/admin">
            {dashboardLabel}
            <Chevron />
          </Link>
        )
        : dashboardLabel
      }
      {stepNav.map((item, i) => {
        const StepLabel = <span key={i}>{item.label}</span>;

        const Step = stepNav.length === i + 1
          ? StepLabel
          : (
            <Link
              to={item.url}
              key={i}
            >
              {StepLabel}
              <Chevron />
            </Link>
          );

        return Step;
      })}
    </nav>
  );
};

export {
  StepNavProvider,
  useStepNav,
};

export default StepNav;
