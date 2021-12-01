import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect } from 'react';
import Button from '../Button';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { Props } from './types';

import './index.scss';

const baseClass = 'revisions-count';

const Revisions: React.FC<Props> = ({ collection, global, id, submissionCount }) => {
  const { serverURL, routes: { admin } } = useConfig();

  let initialParams;
  let fetchURL: string;
  let revisionsURL: string;

  if (collection) {
    initialParams = {
      where: {
        parent: {
          equals: id,
        },
      },
    };

    fetchURL = `${serverURL}/api/${collection.slug}/revisions`;
    revisionsURL = `${admin}/collections/${collection.slug}/${id}/revisions`;
  }

  if (global) {
    fetchURL = `${serverURL}/api/globals/${global.slug}/revisions`;
    revisionsURL = `${admin}/globals/${global.slug}/revisions`;
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
              No revisions found
            </React.Fragment>
          )}
          {data?.docs?.length > 0 && (
            <React.Fragment>
              <Button
                className={`${baseClass}__button`}
                buttonStyle="none"
                el="link"
                to={revisionsURL}
              >
                {data.docs.length}
                {' '}
                revision
                {data.docs.length > 1 && 's'}
                {' '}
                found
              </Button>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {isLoading && (
        <React.Fragment>
          Loading revisions...
        </React.Fragment>
      )}
    </div>
  );
};
export default Revisions;
