import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect } from 'react';
import Button from '../Button';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { Props } from './types';

import './index.scss';

const baseClass = 'versions-count';

const Versions: React.FC<Props> = ({ collection, global, id, submissionCount }) => {
  const { serverURL, routes: { admin, api } } = useConfig();

  let initialParams;
  let fetchURL: string;
  let versionsURL: string;

  if (collection) {
    initialParams = {
      where: {
        parent: {
          equals: id,
        },
      },
    };

    fetchURL = `${serverURL}${api}/${collection.slug}/versions`;
    versionsURL = `${admin}/collections/${collection.slug}/${id}/versions`;
  }

  if (global) {
    fetchURL = `${serverURL}${api}/globals/${global.slug}/versions`;
    versionsURL = `${admin}/globals/${global.slug}/versions`;
  }

  const [{ data, isLoading }, { setParams }] = usePayloadAPI(fetchURL, {
    initialParams,
  });

  useEffect(() => {
    if (submissionCount) {
      setTimeout(() => {
        setParams({
          where: {
            parent: {
              equals: id,
            },
          },
          c: submissionCount,
        });
      }, 1000);
    }
  }, [setParams, submissionCount, id]);

  return (
    <div className={baseClass}>
      {(!isLoading && data?.docs) && (
        <React.Fragment>
          {data.docs.length === 0 && (
            <React.Fragment>
              No versions found
            </React.Fragment>
          )}
          {data?.docs?.length > 0 && (
            <React.Fragment>
              <Button
                className={`${baseClass}__button`}
                buttonStyle="none"
                el="link"
                to={versionsURL}
              >
                {data.totalDocs}
                {' '}
                version
                {data.totalDocs > 1 && 's'}
                {' '}
                found
              </Button>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {isLoading && (
        <React.Fragment>
          Loading versions...
        </React.Fragment>
      )}
    </div>
  );
};
export default Versions;
