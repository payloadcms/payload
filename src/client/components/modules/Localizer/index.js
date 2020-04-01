import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import config from '../../../securedConfig';
import { useLocale } from '../../utilities/Locale';
import { useSearchParams } from '../../utilities/SearchParams';
import Arrow from '../../graphics/Arrow';

import './index.scss';

const baseClass = 'localizer';

const Localizer = () => {
  const [active, setActive] = useState(false);
  const activeLocale = useLocale();
  const searchParams = useSearchParams();

  const { locales } = config.localization ? config.localization : { locales: [] };

  if (locales.length <= 1) return null;

  const classes = [
    baseClass,
    active && `${baseClass}--active`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        onClick={() => setActive(!active)}
        className={`${baseClass}__current`}
      >
        <Arrow />
        {activeLocale}
      </button>
      <ul>
        {locales.map((locale, i) => {
          if (activeLocale === locale) return null;

          const newParams = {
            ...searchParams,
            locale,
          };

          const search = qs.stringify(newParams);

          return (
            <li key={i}>
              <Link
                to={{ search }}
                onClick={() => setActive(false)}
              >
                {locale}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Localizer;
