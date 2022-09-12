import React, { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import Chevron from '../../icons/Chevron';
import { usePreferences } from '../../utilities/Preferences';

import './index.scss';

const baseClass = 'nav-group';

type Props = {
  children: React.ReactNode,
  label: string,
}

const NavGroup: React.FC<Props> = ({
  children,
  label,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [animate, setAnimate] = useState(false);
  const { getPreference, setPreference } = usePreferences();

  const preferencesKey = `collapsed-${label}-groups`;

  useEffect(() => {
    if (label) {
      const setCollapsedFromPreferences = async () => {
        const preferences = await getPreference(preferencesKey) || [];
        setCollapsed(preferences.indexOf(label) !== -1);
      };
      setCollapsedFromPreferences();
    }
  }, [getPreference, label, preferencesKey]);

  if (label) {
    const toggleCollapsed = async () => {
      setAnimate(true);
      let preferences: string[] = await getPreference(preferencesKey) || [];
      if (collapsed) {
        preferences = preferences.filter((preference) => label !== preference);
      } else {
        preferences.push(label);
      }
      setPreference(preferencesKey, preferences);
      setCollapsed(!collapsed);
    };

    return (
      <div
        id={`nav-group-${label}`}
        className={[
          `${baseClass}`,
          `${label}`,
          collapsed && `${baseClass}--collapsed`,
        ].filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className={[
            `${baseClass}__toggle`,
            `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
          ].filter(Boolean)
            .join(' ')}
          onClick={toggleCollapsed}
        >
          <div className={`${baseClass}__label`}>
            {label}
          </div>
          <Chevron className={`${baseClass}__indicator`} />
        </button>
        <AnimateHeight
          height={collapsed ? 0 : 'auto'}
          duration={animate ? 200 : 0}
        >
          <div className={`${baseClass}__content`}>
            {children}
          </div>
        </AnimateHeight>
      </div>
    );
  }

  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
};

export default NavGroup;
