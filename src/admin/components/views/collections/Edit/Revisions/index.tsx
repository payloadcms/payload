import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect } from 'react';
import Button from '../../../../elements/Button';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import { Props } from './types';

import './index.scss';

const baseClass = 'revisions-count';

const Revisions: React.FC<Props> = ({ collection, id, submissionCount }) => {
  const { serverURL, routes: { admin } } = useConfig();

  const [{ data, isLoading }, { setParams }] = usePayloadAPI(`${serverURL}/api/${collection.slug}/revisions`, {
    initialParams: {
      where: {
        parent: {
          equals: id,
        },
      },
    },
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
                to={`${admin}/collections/${collection.slug}/${id}/revisions`}
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
