import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import { useLocale } from '../../utilities/Locale';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';

import './index.scss';

const baseClass = 'localizer';

const { localization } = PAYLOAD_CONFIG;

const Localizer = () => {
  const locale = useLocale();
  const searchParams = useSearchParams();

  if (localization) {
    const { locales } = localization;

    return (
      <div className={baseClass}>
        <Popup
          align="left"
          button={locale}
          render={({ close }) => {
            return (
              <ul>
                {locales.map((localeOption) => {
                  const baseLocaleClass = `${baseClass}__locale`;

                  const localeClasses = [
                    baseLocaleClass,
                    locale === localeOption && `${baseLocaleClass}--active`,
                  ];

                  const newParams = {
                    ...searchParams,
                    locale: localeOption,
                  };

                  const search = qs.stringify(newParams);

                  return (
                    <li
                      key={localeOption}
                      className={localeClasses}
                    >
                      <Link
                        to={{ search }}
                        onClick={close}
                      >
                        {localeOption}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          }}
        />
      </div>
    );
  }

  return null;
};

export default Localizer;
