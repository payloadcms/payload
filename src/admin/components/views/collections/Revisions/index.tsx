import { useConfig } from '@payloadcms/config-provider';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Loading from '../../../elements/Loading';
import { Props } from './types';

const baseClass = 'revisions';

const Revisions: React.FC<Props> = ({ collection }) => {
  const { serverURL } = useConfig();
  const { params: { id } } = useRouteMatch<{ id: string }>();

  const [{ data, isLoading }] = usePayloadAPI(`${serverURL}/api/${collection.slug}/revisions`, {
    initialParams: {
      where: {
        parent: {
          equals: id,
        },
      },
    },
  });

  return (
    <div className={baseClass}>
      {isLoading && (
        <Loading />
      )}
      {data?.docs && (
        <React.Fragment>
          <h1>Revisions</h1>
          {data?.docs?.length}
        </React.Fragment>
      )}
    </div>
  );
};

export default Revisions;
