import React from 'react';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { shouldIncrementVersionCount } from '../../../../versions/shouldIncrementVersionCount';

import './index.scss';

const baseClass = 'versions-count';

const VersionsCount: React.FC<Props> = ({ collection, global, id }) => {
  const { routes: { admin } } = useConfig();
  const { versions, publishedDoc, unpublishedVersions } = useDocumentInfo();

  // Doc status could come from three places:
  // 1. the newest unpublished version (a draft)
  // 2. the published doc's status, in the event that the doc is published and there are no newer versions
  // 3. if there is no published doc, it's a draft
  const docStatus = unpublishedVersions?.docs?.[0]?.version?._status || publishedDoc?._status || 'draft';

  let versionsURL: string;
  let entity: SanitizedCollectionConfig | SanitizedGlobalConfig;

  if (collection) {
    versionsURL = `${admin}/collections/${collection.slug}/${id}/versions`;
    entity = collection;
  }

  if (global) {
    versionsURL = `${admin}/globals/${global.slug}/versions`;
    entity = global;
  }

  let initialVersionsCount = 0;

  if (shouldIncrementVersionCount({ entity, versions, docStatus })) {
    initialVersionsCount = 1;
  }

  const versionCount = (versions?.totalDocs || 0) + initialVersionsCount;

  return (
    <div className={baseClass}>
      {versionCount === 0 && 'No versions found'}
      {versionCount > 0 && (
        <Button
          className={`${baseClass}__button`}
          buttonStyle="none"
          el="link"
          to={versionsURL}
        >
          {versionCount}
          {' '}
          version
          {versionCount > 1 && 's'}
          {' '}
          found
        </Button>
      )}
    </div>
  );
};
export default VersionsCount;
