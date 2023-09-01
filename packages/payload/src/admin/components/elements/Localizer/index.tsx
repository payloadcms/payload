import qs from 'qs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useConfig } from '../../utilities/Config';
import { useLocale } from '../../utilities/Locale';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';
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
                        className={localeClasses}
                        key={localeOption.code}
                      >
                        <Link
                          onClick={close}
                          to={{ search }}
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
          button={locale.label}
          horizontalAlign="left"
          showScrollbar
        />
      </div>
    );
  }

  return null;
};

export default Localizer;
