import React from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config/index.js';
import { useLocale } from '../../utilities/Locale/index.js';
import { useSearchParams } from '../../utilities/SearchParams/index.js';
import Popup from '../Popup/index.js';


import './index.scss';

const baseClass = 'localizer';

const Localizer: React.FC = () => {
  const config = useConfig();
  const { localization } = config;

  const locale = useLocale();
  const searchParams = useSearchParams();
  const { t } = useTranslation('general');

  if (localization) {
    const { locales } = localization;

    return (
      <div className={baseClass}>
        <Popup
          showScrollbar
          horizontalAlign="left"
          button={locale.label}
          render={({ close }) => (
            <div>
              <span>{t('locales')}</span>
              <ul>
                {locales.map((localeOption) => {
                  const baseLocaleClass = `${baseClass}__locale`;

                  const localeClasses = [
                    baseLocaleClass,
                    locale.code === localeOption.code && `${baseLocaleClass}--active`,
                  ].filter(Boolean).join('');

                  const newParams = {
                    ...searchParams,
                    locale: localeOption.code,
                  };

                  const search = qs.stringify(newParams);

                  if (localeOption.code !== locale.code) {
                    return (
                      <li
                        key={localeOption.code}
                        className={localeClasses}
                      >
                        <Link
                          to={{ search }}
                          onClick={close}
                        >
                          {localeOption.label}
                        </Link>
                      </li>
                    );
                  }

                  return null;
                })}
              </ul>
            </div>
          )}
        />
      </div>
    );
  }

  return null;
};

export default Localizer;
