import React, { useState, useCallback, useEffect } from 'react';
import qs from 'qs';
import { useConfig } from '@payloadcms/config-provider';
import format from 'date-fns/format';
import { Props } from './types';
import ReactSelect from '../../../elements/ReactSelect';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { mostRecentVersionOption } from '../shared';

import './index.scss';

const baseClass = 'compare-version';

const maxResultsPerRequest = 10;

const baseOptions = [
  mostRecentVersionOption,
];

const CompareVersion: React.FC<Props> = (props) => {
  const { onChange, value, baseURL, parentID } = props;

  const {
    admin: {
      dateFormat,
    },
  } = useConfig();

  const [options, setOptions] = useState(baseOptions);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState('');

  const getResults = useCallback(async ({
    lastLoadedPage: lastLoadedPageArg,
  } = {}) => {
    const query = {
      limit: maxResultsPerRequest,
      page: lastLoadedPageArg,
      depth: 0,
      where: undefined,
    };

    if (parentID) {
      query.where = {
        parent: {
          equals: parentID,
        },
      };
    }

    const search = qs.stringify(query);
    const response = await fetch(`${baseURL}?${search}`);

    if (response.ok) {
      const data: PaginatedDocs<any> = await response.json();
      if (data.docs.length > 0) {
        setOptions((existingOptions) => [
          ...existingOptions,
          ...data.docs.map((doc) => ({
            label: format(new Date(doc.createdAt), dateFormat),
            value: doc.id,
          })),
        ]);
        setLastLoadedPage(data.page);
      }
    } else {
      setErrorLoading('An error has occurred.');
    }
  }, [dateFormat, baseURL, parentID]);

  const classes = [
    'field-type',
    baseClass,
    errorLoading && 'error-loading',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    getResults({ lastLoadedPage: 1 });
  }, [getResults]);

  return (
    <div className={classes}>
      <div className={`${baseClass}__label`}>
        Compare version against:
      </div>
      {!errorLoading && (
        <ReactSelect
          isSearchable={false}
          placeholder="Select a version to compare"
          onChange={onChange}
          onMenuScrollToBottom={() => {
            getResults({ lastLoadedPage: lastLoadedPage + 1 });
          }}
          value={value}
          options={options}
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
