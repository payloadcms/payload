import React, { useEffect, useState, useCallback } from 'react';
import qs from 'qs';

import { Link } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import { usePreferences } from '../../utilities/Preferences';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'per-page';
type Props = {
  collectionSlug: string;
}

const PerPage: React.FC<Props> = ({ collectionSlug }) => {
  const preferencesKey = `${collectionSlug}-per-page`;
  const { admin: { pagination: { default: defaultPagination, options } } } = useConfig();
  const { getPreference, setPreference } = usePreferences();
  const [, setPerPage] = useState(defaultPagination);
  const searchParams = useSearchParams();

  const updatePerPage = useCallback((perPage) => {
    setPerPage(perPage);
    setPreference(preferencesKey, perPage);
  }, [setPerPage, setPreference, preferencesKey]);

  useEffect(() => {
    const asyncGetPreference = async () => {
      const perPageFromPreferences = await getPreference<number>(preferencesKey) || defaultPagination;
      setPerPage(perPageFromPreferences);
    };

    asyncGetPreference();
  }, [defaultPagination, preferencesKey, getPreference]);

  const closeAndSet = ({ close, option }) => {
    console.log(`Setting option: ${option}`);
    updatePerPage(option);
    close();
  };

  return (
    <div className={baseClass}>
      <Popup
        horizontalAlign="center"
        button={(
          <div>
            Per Page:
            <Chevron />
          </div>
        )}
        backgroundColor="#333333"
        render={({ close }) => (
          <div>
            <ul>
              {options.map((option, i) => {
                const newParams = {
                  ...searchParams,
                  limit: option,
                };

                const search = qs.stringify(newParams);
                const linkPath = `${collectionSlug}?${search}`;

                return (
                  <li
                    className={`${baseClass}-item`}
                    key={i}
                  >
                    <Link
                      to={linkPath}
                      onClick={() => closeAndSet({ close, option })}
                    >
                      {option}
                    </Link>

                  </li>
                );
              })}
              ;

            </ul>
          </div>
        )}
      />
    </div>
  );
};

export default PerPage;
