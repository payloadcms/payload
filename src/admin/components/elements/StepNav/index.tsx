import React, {
  useState, createContext, useContext,
} from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Chevron from '../../icons/Chevron';
import { Context as ContextType } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useConfig } from '../../utilities/Config';

import './index.scss';

const Context = createContext({} as ContextType);

const StepNavProvider: React.FC<{children?: React.ReactNode}> = ({ children }) => {
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

const useStepNav = (): ContextType => useContext(Context);

export const StepNav: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dashboardLabel = <span>{t('general:dashboard')}</span>;
  const { stepNav } = useStepNav();
  const config = useConfig();
  const { routes: { admin } } = config;

  return (
    <nav className="step-nav">
      {stepNav.length > 0
        ? (
          <Link to={admin}>
            {dashboardLabel}
            <Chevron />
          </Link>
        )
        : dashboardLabel}
      {stepNav.map((item, i) => {
        const StepLabel = <span key={i}>{getTranslation(item.label, i18n)}</span>;

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
