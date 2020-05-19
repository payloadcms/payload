import React, { useState } from 'react';
import { useLocale } from '../../utilities/Locale';
import Popup from '../Popup';

import './index.scss';

const baseClass = 'localizer';

const { localization } = PAYLOAD_CONFIG;

const Localizer = () => {
  const locale = useLocale();
  const [active, setActive] = useState(false);

  if (localization) {
    const { locales } = localization;

    return (
      <div className={baseClass}>
        <button
          type="button"
          onClick={() => setActive(!active)}
        >
          {locale}
          <Popup
            align="left"
            active={active}
            handleClose={() => setActive(false)}
          >
            <ul>
              {locales.map((localeOption) => {
                const baseLocaleClass = `${baseClass}__locale`;

                const localeClasses = [
                  baseLocaleClass,
                  locale === localeOption && `${baseLocaleClass}--active`,
                ];

                return (
                  <li
                    key={localeOption}
                    className={localeClasses}
                  >
                    {localeOption}
                  </li>
                );
              })}
            </ul>
          </Popup>
        </button>
      </div>
    );
  }

  return null;
};

export default Localizer;
