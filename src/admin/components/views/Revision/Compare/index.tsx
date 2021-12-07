import React, { useState, useCallback, useEffect } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import format from 'date-fns/format';
import { Props } from './types';
import ReactSelect from '../../../elements/ReactSelect';
import { PaginatedDocs } from '../../../../../mongoose/types';

import './index.scss';

const baseClass = 'compare-revision';

const maxResultsPerRequest = 10;

const CompareRevision: React.FC<Props> = (props) => {
  const { onChange, value, baseURL } = props;

  const {
    admin: {
      dateFormat,
    },
  } = useConfig();

  const [options, setOptions] = useState([]);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState('');

  const getResults = useCallback(async ({
    lastLoadedPage: lastLoadedPageArg,
  } = {}) => {
    const response = await fetch(`${baseURL}?limit=${maxResultsPerRequest}&page=${lastLoadedPageArg}&depth=0`);

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
  }, [dateFormat, baseURL]);

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
      {!errorLoading && (
        <ReactSelect
          isSearchable={false}
          placeholder="Select a revision to compare"
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

export default CompareRevision;
