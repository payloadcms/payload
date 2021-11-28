import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Eyebrow from '../../../elements/Eyebrow';
import Loading from '../../../elements/Loading';
import { useStepNav } from '../../../elements/StepNav';
import { StepNavItem } from '../../../elements/StepNav/types';
import Meta from '../../../utilities/Meta';
import { Props } from './types';

const baseClass = 'revisions';

const Revisions: React.FC<Props> = ({ collection }) => {
  const { serverURL, routes: { admin } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id } } = useRouteMatch<{ id: string }>();

  const [{ data: doc }] = usePayloadAPI(`${serverURL}/api/${collection.slug}/${id}`);

  const [{ data: revisionsData, isLoading: isLoadingRevisions }] = usePayloadAPI(`${serverURL}/api/${collection.slug}/revisions`, {
    initialParams: {
      where: {
        parent: {
          equals: id,
        },
      },
    },
  });

  useEffect(() => {
    const nav: StepNavItem[] = [
      {
        url: `${admin}/collections/${collection.slug}`,
        label: collection.labels.plural,
      },
      {
        label: doc ? doc[collection.admin.useAsTitle || 'id'] : '',
        url: `${admin}/collections/${collection.slug}/${id}`,
      },
      {
        label: 'Revisions',
      },
    ];

    setStepNav(nav);
  }, [setStepNav, collection, doc, admin, id]);

  return (
    <div className={baseClass}>
      <Meta
        title={`Revisions - ${doc[collection.admin.useAsTitle] ? doc[collection.admin.useAsTitle] : doc?.id} - ${collection.labels.singular}`}
        description={`Viewing revisions for the ${collection.labels.singular} ${doc[collection.admin.useAsTitle] ? doc[collection.admin.useAsTitle] : doc?.id}`}
        keywords={`Revisions, ${collection.labels.singular}, Payload, CMS`}
      />
      <Eyebrow />

      {isLoadingRevisions && (
        <Loading />
      )}
      {revisionsData?.docs && (
        <React.Fragment>
          <h1>Revisions</h1>
          {revisionsData?.docs?.length}
        </React.Fragment>
      )}
    </div>
  );
};

export default Revisions;
