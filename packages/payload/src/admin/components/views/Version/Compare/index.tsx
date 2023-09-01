import qs from 'qs';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PaginatedDocs } from '../../../../../database/types';
import type { Where } from '../../../../../types';
import type { Props } from './types';

import { formatDate } from '../../../../utilities/formatDate';
import ReactSelect from '../../../elements/ReactSelect';
import { useConfig } from '../../../utilities/Config';
import { mostRecentVersionOption, publishedVersionOption } from '../shared';
import './index.scss';

const baseClass = 'compare-version';

const maxResultsPerRequest = 10;

const baseOptions = [
  mostRecentVersionOption,
];

const CompareVersion: React.FC<Props> = (props) => {
  const { baseURL, onChange, parentID, publishedDoc, value, versionID } = props;

  const {
    admin: {
      dateFormat,
    },
  } = useConfig();

  const [options, setOptions] = useState(baseOptions);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState('');
  const { i18n, t } = useTranslation('version');

  const getResults = useCallback(async ({
    lastLoadedPage: lastLoadedPageArg,
  }) => {
    const query: {
      [key: string]: unknown
      where: Where
    } = {
      depth: 0,
      limit: maxResultsPerRequest,
      page: lastLoadedPageArg,
      where: {
        and: [
          {
            id: {
              not_equals: versionID,
            },
          },
        ],
      },
    };

    if (parentID) {
      query.where.and.push({
        parent: {
          equals: parentID,
        },
      });
    }

    const search = qs.stringify(query);
    const response = await fetch(`${baseURL}?${search}`, {
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
      },
    });

    if (response.ok) {
      const data: PaginatedDocs = await response.json();
      if (data.docs.length > 0) {
        setOptions((existingOptions) => [
          ...existingOptions,
          ...data.docs.map((doc) => ({
            label: formatDate(doc.updatedAt, dateFormat, i18n?.language),
            value: doc.id,
          })),
        ]);
        setLastLoadedPage(data.page);
      }
    } else {
      setErrorLoading(t('error:unspecific'));
    }
  }, [dateFormat, baseURL, parentID, versionID, t, i18n]);

  const classes = [
    'field-type',
    baseClass,
    errorLoading && 'error-loading',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    getResults({ lastLoadedPage: 1 });
  }, [getResults]);

  useEffect(() => {
    if (publishedDoc?._status === 'published') setOptions((currentOptions) => [publishedVersionOption, ...currentOptions]);
  }, [publishedDoc]);

  return (
    <div className={classes}>
      <div className={`${baseClass}__label`}>
        {t('compareVersion')}
      </div>
      {!errorLoading && (
        <ReactSelect
          onMenuScrollToBottom={() => {
            getResults({ lastLoadedPage: lastLoadedPage + 1 });
          }}
          isSearchable={false}
          onChange={onChange}
          options={options}
          placeholder={t('selectVersionToCompare')}
          value={value}
        />
      )}
      {errorLoading && (
        <div className={`${baseClass}__error-loading`}>
          {errorLoading}
        </div>
      )}
    </div>
  );
};

export default CompareVersion;
