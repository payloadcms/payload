import { useConfig } from '@payloadcms/config-provider';
import React from 'react';
import Button from '../Button';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { shouldIncrementVersionCount } from '../../../../versions/shouldIncrementVersionCount';

import './index.scss';

const baseClass = 'versions-count';

const Versions: React.FC<Props> = ({ collection, global, id }) => {
  const { routes: { admin } } = useConfig();
  const { versions, publishedDoc } = useDocumentInfo();

  const docStatus = publishedDoc?._status;
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
export default Versions;
