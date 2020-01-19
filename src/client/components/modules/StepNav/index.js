import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Arrow from '../../graphics/Arrow';

import './index.scss';

const Context = createContext({});

const StepNavProvider = ({ children }) => {
  const [nav, setNav] = useState([]);

  return (
    <Context.Provider value={{
      nav,
      setNav,
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
  const { nav } = useStepNav();

  return (
    <nav className="step-nav">
      {nav.length > 0
        ? (
          <Link to="/">
            {dashboardLabel}
            <Arrow />
          </Link>
        )
        : dashboardLabel
      }
      {nav.map((item, i) => {
        const StepLabel = <span key={i}>{item.label}</span>;

        const Step = nav.length === i + 1
          ? StepLabel
          : (
            <Link
              to={item.url}
              key={i}
            >
              {StepLabel}
              <Arrow />
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
