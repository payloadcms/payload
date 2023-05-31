import React from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useLocale } from '../../utilities/Locale';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';

import './index.scss';

const baseClass = 'localizer';

const Localizer: React.FC = () => {
  const { localization } = useConfig();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { t } = useTranslation('general');

  if (localization) {
    const { locales } = localization;

    return (
      <div className={baseClass}>
        <Popup
          horizontalAlign="left"
          button={locale}
          render={({ close }) => (
            <div>
              <span>{t('locales')}</span>
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

                  if (localeOption !== locale) {
                    return (
                      <li
                        key={localeOption}
                        className={localeClasses.join(' ')}
                      >
                        <Link
                          to={{ search }}
                          onClick={close}
                        >
                          {localeOption}
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
